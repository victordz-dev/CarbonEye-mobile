import { useState, useEffect, useCallback } from 'react';
import { storage } from '../storage';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const favs = await storage.getFavorites();
    setFavorites(favs);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (areaId: string): Promise<boolean> => {
    const isFav = await storage.toggleFavorite(areaId);
    await loadFavorites();
    return isFav;
  };

  const isFavorite = (areaId: string): boolean => {
    return favorites.includes(areaId);
  };

  return {
    favorites,
    loadingFavorites: loading,
    toggleFavorite,
    isFavorite,
    refreshFavorites: loadFavorites,
  };
};
