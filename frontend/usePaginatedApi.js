import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * Custom hook for infinite scroll and paginated API requests.
 * @param {string} endpoint - API route (e.g. '/letters/inbox.php')
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Number of items per page (default: 15)
 * @param {Object} options.params - Additional query parameters (e.g., { user_id: 1 })
 */
export function usePaginatedApi(endpoint, { limit = 15, params = {} } = {}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Prevent race conditions with ref tracking
  const isFetchingRef = useRef(false);
  const observerTargetRef = useRef(null);

  // Stringify params for deep-dependency comparison
  const paramsKey = JSON.stringify(params);

  const fetchItems = useCallback(
    async (pageToFetch, isInitial = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          page: pageToFetch,
          limit,
          ...JSON.parse(paramsKey),
        }).toString();

        const response = await api.get(`${endpoint}?${queryParams}`);

        if (response.data?.success) {
          const newLetters = response.data.letters || [];
          const pagination = response.data.pagination;

          setItems((prev) =>
            pageToFetch === 1 ? newLetters : [...prev, ...newLetters]
          );
          setHasMore(pagination?.has_more ?? newLetters.length === limit);
          setPage(pageToFetch);
        } else {
          setError(response.data?.message || 'Failed to fetch items');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [endpoint, limit, paramsKey]
  );

  // Initial fetch or re-fetch when params change
  useEffect(() => {
    fetchItems(1, true);
  }, [fetchItems]);

  // Load next page
  const loadMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current && !loading && !loadingMore) {
      fetchItems(page + 1, false);
    }
  }, [hasMore, loading, loadingMore, page, fetchItems]);

  // Reset / Refresh back to page 1
  const refresh = useCallback(() => {
    return fetchItems(1, true);
  }, [fetchItems]);

  // Infinite scroll IntersectionObserver setup
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [loadMore, hasMore]);

  return {
    items,
    setItems,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    observerTargetRef,
  };
}