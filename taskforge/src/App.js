import React, { useState, useEffect } from 'react';
import './App.css';

const TaskForge = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    story_points: 1
  });

  useEffect(() => {
    const savedTasks = localStorage.getItem('taskforge_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taskforge_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const columns = [
    { id: 'backlog', title: 'Backlog', color: '#6c757d' },
    { id: 'todo', title: 'To Do', color: '#007bff' },
    { id: 'in-progress', title: 'In Progress', color: '#ffc107' },
    { id: 'done', title: 'Done', color: '#28a745' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingTask) {
      setTasks(tasks.map(task => 
        task.id === editingTask.id 
          ? { ...task, ...formData, updatedAt: new Date().toISOString() }
          : task
      ));
    } else {
      const newTask = {
        id: Date.now(),
        ...formData,
        status: 'backlog',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assignee: '',
      story_points: 1
    });
    setEditingTask(null);
    setShowModal(false);
  };

  const editTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignee: task.assignee,
      story_points: task.story_points
    });
    setShowModal(true);
  };

  const deleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const moveTask = (taskId, newStatus) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    ));
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const totalPoints = tasks.reduce((sum, t) => sum + t.story_points, 0);
    const completedPoints = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + t.story_points, 0);
    
    return { total, completed, inProgress, totalPoints, completedPoints };
  };

  const stats = getStats();

  return (
    <div className="taskforge">
      <header className="header">
        <h1>⚡ TaskForge</h1>
        <p>Agile Task Management</p>
        <button className="add-task-btn" onClick={() => setShowModal(true)}>
          + Add Task
        </button>
      </header>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Total Tasks:</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Completed:</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
        <div className="stat">
          <span className="stat-label">In Progress:</span>
          <span className="stat-value">{stats.inProgress}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Story Points:</span>
          <span className="stat-value">{stats.completedPoints}/{stats.totalPoints}</span>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map(column => (
          <div key={column.id} className="column">
            <div className="column-header" style={{ backgroundColor: column.color }}>
              <h3>{column.title}</h3>
              <span className="task-count">{getTasksByStatus(column.id).length}</span>
            </div>
            <div className="column-content">
              {getTasksByStatus(column.id).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={editTask}
                  onDelete={deleteTask}
                  onMove={moveTask}
                  columns={columns}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={resetForm}>&times;</span>
            <h2>{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Task Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
              <textarea
                placeholder="Task Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
              />
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="text"
                placeholder="Assignee"
                value={formData.assignee}
                onChange={(e) => setFormData({...formData, assignee: e.target.value})}
              />
              <input
                type="number"
                placeholder="Story Points"
                min="1"
                max="13"
                value={formData.story_points}
                onChange={(e) => setFormData({...formData, story_points: parseInt(e.target.value)})}
              />
              <button type="submit">
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskCard = ({ task, onEdit, onDelete, onMove, columns }) => {
  return (
    <div className={`task-card priority-${task.priority}`}>
      <div className="task-header">
        <h4>{task.title}</h4>
        <div className="task-actions">
          <button onClick={() => onEdit(task)}>✏️</button>
          <button onClick={() => onDelete(task.id)}>🗑️</button>
        </div>
      </div>
      <p className="task-description">{task.description}</p>
      <div className="task-meta">
        <span className="assignee">👤 {task.assignee || 'Unassigned'}</span>
        <span className="story-points">📊 {task.story_points}pt</span>
      </div>
      <div className="task-footer">
        <select
          value={task.status}
          onChange={(e) => onMove(task.id, e.target.value)}
          className="status-select"
        >
          {columns.map(col => (
            <option key={col.id} value={col.id}>{col.title}</option>
          ))}
        </select>
        <span className="task-date">
          {new Date(task.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default TaskForge;