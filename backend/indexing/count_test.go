package indexing

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/gtsteffaniak/filebrowser/backend/common/settings"
	dbsql "github.com/gtsteffaniak/filebrowser/backend/database/sql"
)

// TestGetDirInfoCore_Count verifies that each subdirectory's Count equals
// its actual number of visible immediate children, not a formula based on
// the parent directory's children.
func TestGetDirInfoCore_Count(t *testing.T) {
	srvPath := filepath.Join("..", "srv")
	absPath, err := filepath.Abs(srvPath)
	if err != nil {
		t.Fatalf("Failed to get absolute path: %v", err)
	}

	designExample := filepath.Join(absPath, "design-example")
	if _, err := os.Stat(designExample); err != nil {
		t.Skipf("design-example not found at %s: %v", designExample, err)
	}

	// Use a unique test database (package-level indexDB may already be set by other tests)
	var db *dbsql.IndexDB
	if indexDB == nil {
		db, _, err = dbsql.NewIndexDB("test_count", "OFF", 1000, 32, false)
		if err != nil {
			t.Fatalf("Failed to create test database: %v", err)
		}
		SetIndexDBForTesting(db)
	} else {
		db = indexDB
	}

	source := &settings.Source{
		Name: "test_count",
		Path: absPath,
		Config: settings.SourceConfig{
			DisableIndexing: false,
			UseLogicalSize:  true,
		},
	}
	source.Config.ResolvedRules = settings.ResolvedRulesConfig{
		FileNames:       make(map[string]settings.ConditionalRule),
		FolderNames:     make(map[string]settings.ConditionalRule),
		FilePaths:       make(map[string]settings.ConditionalRule),
		FolderPaths:     make(map[string]settings.ConditionalRule),
		FileEndsWith:    make([]settings.ConditionalRule, 0),
		FolderEndsWith:  make([]settings.ConditionalRule, 0),
		FileStartsWith:  make([]settings.ConditionalRule, 0),
		FolderStartsWith: make([]settings.ConditionalRule, 0),
		NeverWatchPaths: make(map[string]struct{}),
		IncludeRootItems: make(map[string]struct{}),
	}

	Initialize(source, true, false) // mock=true, isNewDb=false
	idx := GetIndex("test_count")
	if idx == nil {
		t.Fatal("Failed to get test_count index")
	}
	idx.db = db // use our test database

	// Pre-index the design-example directory so folder sizes are cached
	_, _, err = idx.indexDirectory("/design-example/", Options{
		Recursive:         false,
		CheckViewable:     true,
		IsRoutineScan:     true,
		SkipExtendedAttrs: false,
		FollowSymlinks:    true,
		ShowHidden:        true,
	}, nil)
	if err != nil {
		t.Fatalf("Failed to index design-example: %v", err)
	}

	// Get directory info via GetDirInfoCore
	dir, err := os.Open(designExample)
	if err != nil {
		t.Fatalf("Failed to open design-example: %v", err)
	}
	defer dir.Close()

	stat, err := dir.Stat()
	if err != nil {
		t.Fatalf("Failed to stat design-example: %v", err)
	}

	info, err := idx.GetDirInfoCore(dir, stat, "/design-example/", Options{
		Recursive:         false,
		CheckViewable:     true,
		IsRoutineScan:     false,
		SkipExtendedAttrs: true,
		FollowSymlinks:    true,
		ShowHidden:        true,
	}, nil)
	if err != nil {
		t.Fatalf("GetDirInfoCore failed: %v", err)
	}

	// For each subdirectory, verify Count equals its actual child count
	for _, folder := range info.Folders {
		childPath := filepath.Join(designExample, folder.Name)
		entries, err := os.ReadDir(childPath)
		if err != nil {
			t.Errorf("Failed to read directory %s: %v", folder.Name, err)
			continue
		}

		// Count visible children (non-hidden)
		var visibleCount int
		for _, entry := range entries {
			if entry.Name()[0] == '.' {
				continue
			}
			visibleCount++
		}

		if folder.Count != int64(visibleCount) {
			t.Errorf("Folder %s: Count=%d, expected=%d (entries in %s: %v)",
				folder.Name, folder.Count, visibleCount, childPath, entries)
		} else {
			t.Logf("Folder %s: Count=%d (correct)", folder.Name, folder.Count)
		}
	}
}
