import os
import shutil
from pathlib import Path

class FileOrganizer:
    def __init__(self, source_dir):
        self.source_dir = Path(source_dir)
        self.file_types = {
            'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
            'Documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
            'Videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
            'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
            'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
            'Code': ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.php'],
            'Spreadsheets': ['.xls', '.xlsx', '.csv', '.ods']
        }
    
    def organize(self):
        if not self.source_dir.exists():
            print(f"Source directory '{self.source_dir}' does not exist!")
            return
        
        organized_count = 0
        
        for file_path in self.source_dir.iterdir():
            if file_path.is_file():
                category = self.get_file_category(file_path.suffix.lower())
                if category:
                    dest_dir = self.source_dir / category
                    dest_dir.mkdir(exist_ok=True)
                    
                    dest_path = dest_dir / file_path.name
                    
                    # Handle duplicate names
                    counter = 1
                    while dest_path.exists():
                        name = file_path.stem
                        ext = file_path.suffix
                        dest_path = dest_dir / f"{name}_{counter}{ext}"
                        counter += 1
                    
                    try:
                        shutil.move(str(file_path), str(dest_path))
                        print(f"Moved: {file_path.name} -> {category}/")
                        organized_count += 1
                    except Exception as e:
                        print(f"Error moving {file_path.name}: {e}")
        
        print(f"\nOrganization complete! Moved {organized_count} files.")
    
    def get_file_category(self, extension):
        for category, extensions in self.file_types.items():
            if extension in extensions:
                return category
        return None
    
    def preview_organization(self):
        if not self.source_dir.exists():
            print(f"Source directory '{self.source_dir}' does not exist!")
            return
        
        categories = {}
        
        for file_path in self.source_dir.iterdir():
            if file_path.is_file():
                category = self.get_file_category(file_path.suffix.lower())
                if category:
                    if category not in categories:
                        categories[category] = []
                    categories[category].append(file_path.name)
        
        print("Preview of organization:")
        print("-" * 40)
        for category, files in categories.items():
            print(f"\n{category} ({len(files)} files):")
            for file in files[:5]:  # Show first 5 files
                print(f"  - {file}")
            if len(files) > 5:
                print(f"  ... and {len(files) - 5} more")

def main():
    print("File Organizer")
    print("=" * 30)
    
    source = input("Enter the directory path to organize: ").strip()
    if not source:
        source = "."  # Current directory
    
    organizer = FileOrganizer(source)
    
    while True:
        print("\nOptions:")
        print("1. Preview organization")
        print("2. Organize files")
        print("3. Exit")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == '1':
            organizer.preview_organization()
        elif choice == '2':
            confirm = input("Are you sure you want to organize files? (y/N): ")
            if confirm.lower() == 'y':
                organizer.organize()
            else:
                print("Organization cancelled.")
        elif choice == '3':
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()