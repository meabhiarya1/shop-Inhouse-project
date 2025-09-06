import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const Pagination = ({ 
  currentPage, 
  totalPages, 
  total, 
  limit, 
  onPageChange,
  showDetails = true,
  className = ""
}) => {
  // Calculate range of items being shown
  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, total)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show before and after current page
    const pages = []
    
    // Always show first page
    if (totalPages > 0) {
      pages.push(1)
    }
    
    // Add ellipsis if needed
    if (currentPage - delta > 2) {
      pages.push('...')
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      pages.push(i)
    }
    
    // Add ellipsis if needed
    if (currentPage + delta < totalPages - 1) {
      pages.push('...')
    }
    
    // Always show last page (if different from first)
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  if (totalPages <= 1) {
    return showDetails ? (
      <div className={`flex items-center justify-between text-sm text-white/70 ${className}`}>
        <div className="hidden sm:block">
          Showing {total} of {total} results
        </div>
      </div>
    ) : null
  }

  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      {/* Results info - Hidden on mobile */}
      {showDetails && (
        <div className="text-white/70 hidden sm:block">
          Showing {startItem} to {endItem} of {total} results
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center space-x-1 sm:space-x-2 mx-auto sm:mx-0">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          title="First page"
        >
          <ChevronsLeft size={14} className="sm:w-4 sm:h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          title="Previous page"
        >
          <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center space-x-0.5 sm:space-x-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 sm:px-3 py-1 sm:py-2 text-white/50 text-xs sm:text-sm">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          title="Next page"
        >
          <ChevronRight size={14} className="sm:w-4 sm:h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          title="Last page"
        >
          <ChevronsRight size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
