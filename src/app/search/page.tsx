'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearch, useInfiniteScroll } from '@/lib/hooks/search';
import SearchIcon from '@/components/icons/SearchIcon';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import MobileNav from '@/components/MobileNav';
import Image from 'next/image';
import { IconBookmark } from '@/components/icons';
import Link from 'next/link';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(false);
  
  const {
    query,
    recipes,
    loading,
    loadingMore,
    hasNextPage,
    error,
    total,
    search,
    loadMore,
    reset,
  } = useSearch({
    onError: (error) => {
      console.error('Search error:', error);
    },
  });

  const getImageUrl = (recipe: { thumbnailImage?: string; thumbnailUrl?: string; thumbnailPath?: string }) => {
    const thumb = recipe.thumbnailImage || recipe.thumbnailUrl || recipe.thumbnailPath;
    if (!thumb) return '';
    if (/^https?:/i.test(thumb)) return thumb;
    const clean = thumb.startsWith('/') ? thumb.slice(1) : thumb;
    return `/media/${clean.startsWith('media/') ? clean.slice('media/'.length) : clean}`;
  };
  
  // Initialize search with URL parameter
  useEffect(() => {
    if (initialQuery && !hasSearched) {
      setHasSearched(true);
      search(initialQuery);
    }
  }, [initialQuery, hasSearched, search]);
  
  // Infinite scroll
  useInfiniteScroll(loadMore, hasNextPage, loadingMore);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchInput.trim();
    
    if (!trimmedQuery) {
      return;
    }
    
    setHasSearched(true);
    search(trimmedQuery);
    
    // Update URL
    const params = new URLSearchParams();
    params.set('q', trimmedQuery);
    router.push(`/search?${params.toString()}`);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };
  
  const handleReset = () => {
    setSearchInput('');
    setHasSearched(false);
    reset();
    router.push('/search');
  };
  
  const renderContent = () => {
    if (!hasSearched) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              검색어를 입력하세요
            </h2>
            <p className="text-gray-500">
              레시피를 검색하여 새로운 요리를 발견해보세요
            </p>
          </div>
        </div>
      );
    }
    
    if (loading && recipes.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              검색 중 오류가 발생했습니다
            </h2>
            <p className="text-gray-500 mb-4">
              {error.message}
            </p>
            <button
              onClick={() => search(query)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }
    
    if (recipes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              검색 결과가 없습니다
            </h2>
            <p className="text-gray-500 mb-4">
              &quot;{query}&quot;에 대한 검색 결과를 찾을 수 없습니다
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              검색 초기화
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div>
        {/* Recipe Feed - Same as explore page */}
        <ul className="flex flex-col gap-10">
          {recipes.map((recipe) => {
            const imageUrl = getImageUrl(recipe);
            return (
              <li key={recipe.id} className="max-w-[480px] mx-auto w-full">
                <Link href={`/recipes/${recipe.id}`} className="border border-[#eee] rounded-xl overflow-hidden block relative" aria-label={`${recipe.title} 상세 보기`}>
                  {imageUrl ? (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 480px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '16 / 9' }} className="bg-[#f3f4f6]" />
                  )}
                  <div className="absolute top-2 right-2" aria-hidden="true">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/90 border border-[#eee]">
                      <IconBookmark
                        filled={Boolean((recipe as { isSaved?: boolean; isBookmarked?: boolean }).isSaved || (recipe as { isSaved?: boolean; isBookmarked?: boolean }).isBookmarked)}
                        className={Boolean((recipe as { isSaved?: boolean; isBookmarked?: boolean }).isSaved || (recipe as { isSaved?: boolean; isBookmarked?: boolean }).isBookmarked) ? 'text-amber-500' : 'text-[#999]'}
                      />
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="text-[16px] font-semibold text-[#111]">{recipe.title}</div>
                    {recipe.description && <div className="mt-1 text-[13px] text-[#666]">{recipe.description}</div>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* Loading More */}
        {loadingMore && (
          <div className="text-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <span className="ml-2 text-gray-600">더 많은 레시피를 불러오는 중...</span>
          </div>
        )}
        
        {/* No More Results */}
        {!hasNextPage && recipes.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              모든 검색 결과를 확인했습니다
            </p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] flex">
        <Sidebar />
        <main id="main" className="flex-1 px-6 py-6" role="main">
          {/* Search Header */}
          <div className="mb-6">            
            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleInputChange}
                  placeholder="레시피를 검색하세요..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>
          
          {/* Content */}
          {renderContent()}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
