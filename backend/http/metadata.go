package http

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gtsteffaniak/filebrowser/backend/adapters/fs/files"
	"github.com/gtsteffaniak/filebrowser/backend/common/utils"
)

type MetadataResponse struct {
	Name     string       `json:"name"`
	Size     int64        `json:"size"`
	Modified string       `json:"modified"`
	Type     string       `json:"type"`
	Metadata *FileMetadata `json:"metadata,omitempty"`
}

type FileMetadata struct {
	Duration float64 `json:"duration,omitempty"`  // seconds (float for sub-second precision)
	AlbumArt string  `json:"albumArt,omitempty"`  // base64 data URI
	Width    int     `json:"width,omitempty"`     // image/video width (populated client-side)
	Height   int     `json:"height,omitempty"`    // image/video height (populated client-side)
	Title    string  `json:"title,omitempty"`     // audio/video title
	Artist   string  `json:"artist,omitempty"`    // audio artist
}

// metadataHandler returns metadata for a file including audio/video metadata (duration, album art).
// @Summary Get file metadata
// @Description Returns file metadata including audio album art, video/audio duration, and image dimensions.
// @Tags Resources
// @Produce json
// @Param path query string true "Index path to the file"
// @Param source query string true "Source name"
// @Success 200 {object} MetadataResponse
// @Failure 400 {object} map[string]string "Bad request"
// @Failure 403 {object} map[string]string "Forbidden"
// @Failure 404 {object} map[string]string "File not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/resources/metadata [get]
func metadataHandler(w http.ResponseWriter, r *http.Request, d *requestContext) (int, error) {
	path := r.URL.Query().Get("path")
	source := r.URL.Query().Get("source")

	if path == "" {
		return http.StatusBadRequest, fmt.Errorf("path is required")
	}
	if source == "" {
		return http.StatusBadRequest, fmt.Errorf("source is required")
	}

	cleanPath, err := utils.SanitizeUserPath(path)
	if err != nil {
		return http.StatusBadRequest, fmt.Errorf("invalid path: %v", err)
	}

	fileInfo, err := files.FileInfoFaster(utils.FileOptions{
		Path:     cleanPath,
		Source:   source,
		AlbumArt: true,  // request album art extraction for audio files
		Metadata: true,  // request duration/width/height for media files
	}, store.Access, d.user, store.Share)
	if err != nil {
		return errToStatus(err), err
	}

	meta := &FileMetadata{}

	if fileInfo.Metadata != nil {
		meta.Title = fileInfo.Metadata.Title
		meta.Artist = fileInfo.Metadata.Artist
		meta.Duration = float64(fileInfo.Metadata.Duration)
		if len(fileInfo.Metadata.AlbumArt) > 0 {
			meta.AlbumArt = "data:image/jpeg;base64," + string(fileInfo.Metadata.AlbumArt)
		}
	}

	response := MetadataResponse{
		Name:     fileInfo.Name,
		Size:     fileInfo.Size,
		Modified: fileInfo.ModTime.Format("2006-01-02T15:04:05Z"),
		Type:     fileInfo.Type,
		Metadata: meta,
	}

	// Suppress unused variable warning for json import
	_ = json.Marshal

	return renderJSON(w, r, response)
}
