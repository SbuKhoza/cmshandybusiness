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
    imageFile: null,
    date: new Date().toISOString().split('T')[0]
  });

  // Gallery settings
  const [gallerySettings, setGallerySettings] = useState({
    displayStyle: "square", // 'square' or 'portrait'
    defaultSort: "date-desc" // 'date-desc', 'date-asc', 'title-asc', 'title-desc'
  });

  const [editingProject, setEditingProject] = useState(null);

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

  // Add or update project
  const handleSaveProject = async (e) => {
    e.preventDefault();
    
    if (!currentTenantId) return alert("No tenant selected.");
    if (!projectForm.title.trim()) return alert("Please enter a project title.");
    if (!projectForm.imageFile && !editingProject) return alert("Please select an image.");

    setLoading(true);

    try {
      let imageUrl = editingProject?.imageUrl || "";

      // Upload new image if provided
      if (projectForm.imageFile) {
        const imageRef = ref(
          storage,
          `projects/${currentTenantId}/${Date.now()}_${projectForm.imageFile.name}`
        );
        await uploadBytes(imageRef, projectForm.imageFile);
        imageUrl = await getDownloadURL(imageRef);

        // Delete old image if editing
        if (editingProject?.imageUrl) {
          const oldImageRef = ref(storage, editingProject.imageUrl);
          await deleteObject(oldImageRef).catch(() => {});
        }
      }

      const projectData = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        imageUrl,
        date: projectForm.date,
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
        imageFile: null,
        date: new Date().toISOString().split('T')[0]
      });
      setEditingProject(null);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Failed to save project.");
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
      imageFile: null,
      date: project.date
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingProject(null);
    setProjectForm({
      title: "",
      description: "",
      imageFile: null,
      date: new Date().toISOString().split('T')[0]
    });
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Delete project
  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.title}"?`)) return;

    setLoading(true);
    try {
      // Delete image from storage
      if (project.imageUrl) {
        const imageRef = ref(storage, project.imageUrl);
        await deleteObject(imageRef).catch(() => {});
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
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="displayStyle"
                value="square"
                checked={gallerySettings.displayStyle === "square"}
                onChange={(e) => setGallerySettings({ ...gallerySettings, displayStyle: e.target.value })}
              />
              <span>Square (Same width & height)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="displayStyle"
                value="portrait"
                checked={gallerySettings.displayStyle === "portrait"}
                onChange={(e) => setGallerySettings({ ...gallerySettings, displayStyle: e.target.value })}
              />
              <span>Portrait (Narrow width, taller height)</span>
            </label>
          </div>
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
            <label className="form-label">Project Date</label>
            <input
              type="date"
              value={projectForm.date}
              onChange={(e) => setProjectForm({ ...projectForm, date: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Project Image * {editingProject && "(Leave empty to keep current image)"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProjectForm({ ...projectForm, imageFile: e.target.files[0] })}
              className="form-input-file"
            />
            {editingProject && editingProject.imageUrl && (
              <div className="current-image-preview">
                <p>Current Image:</p>
                <img src={editingProject.imageUrl} alt="Current" />
              </div>
            )}
          </div>

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
                  <img src={project.imageUrl} alt={project.title} />
                </div>
                <div className="project-card-content">
                  <h4>{project.title}</h4>
                  <p className="project-date">
                    {new Date(project.date).toLocaleDateString()}
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