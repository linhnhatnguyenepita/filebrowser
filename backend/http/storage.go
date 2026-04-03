package http

import (
	"net/http"
	"golang.org/x/sys/unix"
)

type StorageResponse struct {
	Total int64 `json:"total"`
	Free  int64 `json:"free"`
}

func handleStorage(w http.ResponseWriter, r *http.Request, d *requestContext) (int, error) {
	var stat unix.Statfs_t
	if err := unix.Statfs("/srv", &stat); err != nil {
		http.Error(w, "failed to read storage", http.StatusInternalServerError)
		return http.StatusInternalServerError, nil
	}
	resp := StorageResponse{
		Total: int64(stat.Blocks) * int64(stat.Bsize),
		Free:  int64(stat.Bavail) * int64(stat.Bsize),
	}
	return renderJSON(w, r, resp)
}
