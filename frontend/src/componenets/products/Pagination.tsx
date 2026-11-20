type PaginationProps = {
  totalPages: number;
  currentPage?: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({
  totalPages,
  currentPage = 1,
  onPageChange,
}: PaginationProps) => {
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  return (
    <nav aria-label="Product pages" className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
        className="border border-gray-200 px-4 py-2 font-medium text-sm rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`px-4 py-2 font-semibold text-sm rounded-lg border transition-colors ${
            page === currentPage
              ? "bg-primary text-white border-primary"
              : "border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
        className="border border-gray-200 px-4 py-2 font-medium text-sm rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
