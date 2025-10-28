import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { db, storage } from "../config";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import "./ProjectsCMS.css";

function ProjectsCMS() {
  const { currentTenantId } = useSelector((state) => state.tenant);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Project form state
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    imageFiles: []
  });

  // Gallery settings
  const [gallerySettings, setGallerySettings] = useState({
    displayStyle: "square", // 'square' or 'masonry'
    defaultSort: "date-desc" // 'date-desc', 'date-asc', 'title-asc', 'title-desc'
  });

  const [editingProject, setEditingProject] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  // Load projects
  useEffect(() => {
    if (!currentTenantId) return;

    const projectsRef = collection(db, "tenants", currentTenantId, "projects");
    const q = query(projectsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, [currentTenantId]);

  // Load gallery settings
  useEffect(() => {
    if (!currentTenantId) return;

    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, "tenants", currentTenantId, "data", "gallerySettings");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setGallerySettings(settingsSnap.data());
        }
      } catch (err) {
        console.error("Error loading gallery settings:", err);
      }
    };

    loadSettings();
  }, [currentTenantId]);

  // Save gallery settings
  const handleSaveSettings = async () => {
    if (!currentTenantId) return alert("No tenant selected.");
    
    try {
      const settingsRef = doc(db, "tenants", currentTenantId, "data", "gallerySettings");
      await setDoc(settingsRef, gallerySettings, { merge: true });
      alert("Gallery settings saved!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings.");
    }
  };

  // Handle multiple file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setProjectForm({ ...projectForm, imageFiles: files });
  };

  // Add or update project
  const handleSaveProject = async (e) => {
    e.preventDefault();
    
    if (!currentTenantId) return alert("No tenant selected.");
    if (!projectForm.title.trim()) return alert("Please enter a project title.");
    if (projectForm.imageFiles.length === 0 && !editingProject) {
      return alert("Please select at least one image.");
    }

    setLoading(true);

    try {
      let imageUrls = editingProject?.imageUrls || [];

      // Upload new images if provided
      if (projectForm.imageFiles.length > 0) {
        const uploadPromises = projectForm.imageFiles.map(async (file) => {
          const imageRef = ref(
            storage,
            `projects/${currentTenantId}/${Date.now()}_${file.name}`
          );
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        });

        const newImageUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      const projectData = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        imageUrls,
        updatedAt: new Date()
      };

      if (editingProject) {
        // Update existing project
        const projectRef = doc(db, "tenants", currentTenantId, "projects", editingProject.id);
        await updateDoc(projectRef, projectData);
        alert("Project updated successfully!");
      } else {
        // Add new project
        const projectsRef = collection(db, "tenants", currentTenantId, "projects");
        await addDoc(projectsRef, {
          ...projectData,
          createdAt: new Date()
        });
        alert("Project added successfully!");
      }

      // Reset form
      setProjectForm({
        title: "",
        description: "",
        imageFiles: []
      });
      setEditingProject(null);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Failed to save project: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit project
  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      imageFiles: []
    });
    setSelectedImages([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingProject(null);
    setProjectForm({
      title: "",
      description: "",
      imageFiles: []
    });
    setSelectedImages([]);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Toggle image selection
  const toggleImageSelection = (imageUrl) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl) 
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  // Delete selected images
  const handleDeleteSelectedImages = async () => {
    if (selectedImages.length === 0) return alert("No images selected.");
    if (!window.confirm(`Delete ${selectedImages.length} selected image(s)?`)) return;

    setLoading(true);
    try {
      // Delete from storage
      const deletePromises = selectedImages.map(async (imageUrl) => {
        const imageRef = ref(storage, imageUrl);
        return deleteObject(imageRef).catch(() => {});
      });
      await Promise.all(deletePromises);

      // Update project document
      const updatedImageUrls = editingProject.imageUrls.filter(
        url => !selectedImages.includes(url)
      );

      const projectRef = doc(db, "tenants", currentTenantId, "projects", editingProject.id);
      await updateDoc(projectRef, { imageUrls: updatedImageUrls });

      setSelectedImages([]);
      alert("Selected images deleted successfully!");
    } catch (err) {
      console.error("Error deleting images:", err);
      alert("Failed to delete images.");
    } finally {
      setLoading(false);
    }
  };

  // Delete entire project
  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.title}" and all its images?`)) return;

    setLoading(true);
    try {
      // Delete all images from storage
      if (project.imageUrls && project.imageUrls.length > 0) {
        const deletePromises = project.imageUrls.map(async (imageUrl) => {
          const imageRef = ref(storage, imageUrl);
          return deleteObject(imageRef).catch(() => {});
        });
        await Promise.all(deletePromises);
      }

      // Delete project document
      const projectRef = doc(db, "tenants", currentTenantId, "projects", project.id);
      await deleteDoc(projectRef);
      
      alert("Project deleted successfully!");
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentTenantId) {
    return <div className="no-tenant-message">Please select a tenant first.</div>;
  }

  return (
    <div className="projects-cms-container">
      <h2>Projects Management</h2>

      {/* Gallery Settings */}
      <div className="cms-section">
        <h3>Gallery Settings</h3>
        
        <div className="settings-group">
          <label className="settings-label">Display Style:</label>
          <select
            value={gallerySettings.displayStyle}
            onChange={(e) => setGallerySettings({ ...gallerySettings, displayStyle: e.target.value })}
            className="settings-select"
          >
            <option value="square">Square Grid (All same size)</option>
            <option value="masonry">Masonry Grid (Mixed portrait & landscape)</option>
          </select>
        </div>

        <div className="settings-group">
          <label className="settings-label">Default Sorting:</label>
          <select
            value={gallerySettings.defaultSort}
            onChange={(e) => setGallerySettings({ ...gallerySettings, defaultSort: e.target.value })}
            className="settings-select"
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>

        <button className="btn-secondary" onClick={handleSaveSettings}>
          Save Gallery Settings
        </button>
      </div>

      {/* Add/Edit Project Form */}
      <div className="cms-section">
        <h3>{editingProject ? "Edit Project" : "Add New Project"}</h3>
        
        <form onSubmit={handleSaveProject} className="project-form">
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input
              type="text"
              value={projectForm.title}
              onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
              className="form-input"
              placeholder="Enter project title"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="form-textarea"
              rows="4"
              placeholder="Enter project description"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Project Images * (Select multiple images)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="form-input-file"
            />
            {projectForm.imageFiles.length > 0 && (
              <p className="file-count">{projectForm.imageFiles.length} file(s) selected</p>
            )}
          </div>

          {/* Show existing images when editing */}
          {editingProject && editingProject.imageUrls && editingProject.imageUrls.length > 0 && (
            <div className="existing-images">
              <label className="form-label">
                Existing Images (Select images to delete)
              </label>
              <div className="images-grid">
                {editingProject.imageUrls.map((imageUrl, index) => (
                  <div
                    key={index}
                    className={`image-item ${selectedImages.includes(imageUrl) ? 'selected' : ''}`}
                    onClick={() => toggleImageSelection(imageUrl)}
                  >
                    <img src={imageUrl} alt={`Image ${index + 1}`} />
                    {selectedImages.includes(imageUrl) && (
                      <div className="check-overlay">✓</div>
                    )}
                  </div>
                ))}
              </div>
              {selectedImages.length > 0 && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeleteSelectedImages}
                  disabled={loading}
                >
                  Delete {selectedImages.length} Selected Image(s)
                </button>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : editingProject ? "Update Project" : "Add Project"}
            </button>
            {editingProject && (
              <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Projects List */}
      <div className="cms-section">
        <h3>All Projects ({projects.length})</h3>
        
        {projects.length === 0 ? (
          <p className="no-projects">No projects yet. Add your first project above!</p>
        ) : (
          <div className="projects-list">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-card-image">
                  {project.imageUrls && project.imageUrls.length > 0 ? (
                    <>
                      <img src={project.imageUrls[0]} alt={project.title} />
                      {project.imageUrls.length > 1 && (
                        <div className="image-count-badge">
                          {project.imageUrls.length} images
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-image">No images</div>
                  )}
                </div>
                <div className="project-card-content">
                  <h4>{project.title}</h4>
                  <p className="project-date">
                    {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </p>
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                  <div className="project-card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditProject(project)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteProject(project)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsCMS;