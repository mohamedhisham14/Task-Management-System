const express = require("express");

const db = require("../database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// GET all tasks for logged-in user
router.get("/", authenticateToken, (req, res) => {
    try {
        const tasks = db
            .prepare(`
                SELECT id, title, description, status, created_at
                FROM tasks
                WHERE user_id = ?
                ORDER BY created_at DESC
            `)
            .all(req.user.userId);

        res.json(tasks);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});


// CREATE a task
router.post("/", authenticateToken, (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Title is required"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO tasks
                (title, description, user_id)
                VALUES (?, ?, ?)
            `)
            .run(
                title,
                description || "",
                req.user.userId
            );

        const task = db
            .prepare(`
                SELECT id, title, description, status, created_at
                FROM tasks
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);

        res.status(201).json(task);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create task"
        });
    }
});


// UPDATE a task
router.put("/:id", authenticateToken, (req, res) => {
    try {
        const { title, description, status } = req.body;
        const taskId = req.params.id;

        const existingTask = db
            .prepare(`
                SELECT *
                FROM tasks
                WHERE id = ? AND user_id = ?
            `)
            .get(taskId, req.user.userId);

        if (!existingTask) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        db.prepare(`
            UPDATE tasks
            SET title = ?, description = ?, status = ?
            WHERE id = ? AND user_id = ?
        `).run(
            title ?? existingTask.title,
            description ?? existingTask.description,
            status ?? existingTask.status,
            taskId,
            req.user.userId
        );

        const updatedTask = db
            .prepare(`
                SELECT id, title, description, status, created_at
                FROM tasks
                WHERE id = ?
            `)
            .get(taskId);

        res.json(updatedTask);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update task"
        });
    }
});


// DELETE a task
router.delete("/:id", authenticateToken, (req, res) => {
    try {
        const taskId = req.params.id;

        const result = db
            .prepare(`
                DELETE FROM tasks
                WHERE id = ? AND user_id = ?
            `)
            .run(taskId, req.user.userId);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete task"
        });
    }
});


module.exports = router;