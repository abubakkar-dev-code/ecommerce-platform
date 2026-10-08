import React from "react";

type PaginationProps = {
  totalPages: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
};

const Pagination = ({ totalPages, currentPage = 1, onPageChange }: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        type="button"
        className="border border-gray-200 px-4 py-2 font-medium text-sm rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange && onPageChange(page)}
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
        className="border border-gray-200 px-4 py-2 font-medium text-sm rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

