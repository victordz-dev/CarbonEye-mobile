/**
 * LogService — Serviço centralizado de envio de logs para o backend.
 *
 * Funcionalidades:
 * 1. Buffer em memória para logs gerados ANTES do login (evita 401).
 * 2. Batching com debounce de 5 segundos (agrupa múltiplos logs).
 * 3. Throttle interno para respeitar rate limit de 30 req/min.
 * 4. Usa a instância `api` autenticada (com token JWT no header).
 */
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_BUFFER_KEY = '@carboneye:log_buffer';
const DEBOUNCE_MS = 5000;
const MAX_BATCH_SIZE = 20;
const MIN_INTERVAL_MS = 2000; // ~30 req/min

interface LogEntry {
  acao: string;
  nivel: 'INFO' | 'WARN' | 'ERROR';
  detalhes: Record<string, unknown>;
  timestamp: string;
}

class LogService {
  private buffer: LogEntry[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSentAt = 0;
  private isFlushing = false;
  private isAuthenticated = false;

  /**
   * Enfileira um log para envio.
   * Se o usuário não está autenticado, o log fica no buffer.
   * Se está autenticado, agenda envio em batch via debounce.
   */
  enqueue(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.buffer.push(logEntry);

    if (this.isAuthenticated) {
      this.scheduleFlush();
    }
  }

  /**
   * Marca o serviço como autenticado e envia todos os logs pendentes.
   * Deve ser chamado após o login bem-sucedido.
   */
  async onAuthenticated(): Promise<void> {
    this.isAuthenticated = true;

    // Recupera logs persistidos de sessões anteriores (caso o app tenha fechado)
    await this.loadPersistedBuffer();

    // Envia tudo que estiver no buffer
    await this.flush();
  }

  /**
   * Marca como desautenticado (logout).
   * Persiste o buffer atual para não perder logs.
   */
  async onLogout(): Promise<void> {
    this.isAuthenticated = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    await this.persistBuffer();
  }

  /**
   * Agenda um flush com debounce de 5 segundos.
   */
  private scheduleFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      void this.flush();
    }, DEBOUNCE_MS);
  }

  /**
   * Envia todos os logs do buffer em batches, respeitando rate limit.
   */
  private async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0 || !this.isAuthenticated) {
      return;
    }

    this.isFlushing = true;

    try {
      while (this.buffer.length > 0) {
        // Respeita rate limit
        const now = Date.now();
        const elapsed = now - this.lastSentAt;
        if (elapsed < MIN_INTERVAL_MS) {
          await this.sleep(MIN_INTERVAL_MS - elapsed);
        }

        const batch = this.buffer.splice(0, MAX_BATCH_SIZE);

        try {
          // Envia cada log do batch individualmente (o backend espera um log por request)
          // mas agrupados para não disparar em paralelo
          for (const entry of batch) {
            await api.post('/logs', {
              acao: entry.acao,
              nivel: entry.nivel,
              detalhes: entry.detalhes,
            });
            this.lastSentAt = Date.now();
          }
        } catch (error: unknown) {
          // Se falhou (ex: token expirado), devolve ao buffer e para
          this.buffer.unshift(...batch);
          break;
        }
      }

      // Limpa buffer persistido após envio bem-sucedido
      await AsyncStorage.removeItem(LOG_BUFFER_KEY);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Persiste o buffer no AsyncStorage para sobreviver a fechamento do app.
   */
  private async persistBuffer(): Promise<void> {
    if (this.buffer.length === 0) return;
    try {
      await AsyncStorage.setItem(LOG_BUFFER_KEY, JSON.stringify(this.buffer));
    } catch {
      // Silencioso — melhor perder logs do que crashar
    }
  }

  /**
   * Recupera o buffer do AsyncStorage.
   */
  private async loadPersistedBuffer(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(LOG_BUFFER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LogEntry[];
        // Prepend — logs antigos primeiro
        this.buffer = [...parsed, ...this.buffer];
        await AsyncStorage.removeItem(LOG_BUFFER_KEY);
      }
    } catch {
      // Silencioso
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const logService = new LogService();
