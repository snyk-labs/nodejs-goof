var express = require('express');
var mongoose = require('mongoose');

var router = express.Router();
module.exports = router;

var Todo = mongoose.model('Todo');

function todoToJSON(todo) {
  return {
    id: todo._id,
    content: todo.content ? todo.content.toString('utf8') : '',
    updated_at: todo.updated_at,
  };
}

// GET /api/todos - list all todos
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({}).sort({ updated_at: -1 });
    return res.json(todos.map(todoToJSON));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve todos' });
  }
});

// GET /api/todos/:id - get a single todo
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    return res.json(todoToJSON(todo));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve todo' });
  }
});

// POST /api/todos - create a new todo
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'content is required and must be a non-empty string' });
    }
    const todo = new Todo({
      content: Buffer.from(content.trim(), 'utf8'),
      updated_at: new Date(),
    });
    const saved = await todo.save();
    return res.status(201).json(todoToJSON(saved));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /api/todos/:id - update a todo
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }
    const content = req.body && typeof req.body.content === 'string' ? req.body.content : null;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'content is required and must be a non-empty string' });
    }
    // Fetch first then mutate the model instance to avoid user input flowing
    // directly into a Mongoose query/update operator (prevents NoSQL injection)
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    todo.content = Buffer.from(String(content.trim()), 'utf8');
    todo.updated_at = new Date();
    const updated = await todo.save();
    return res.json(todoToJSON(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id - delete a todo
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }
    const todo = await Todo.findByIdAndRemove(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    return res.json({ message: 'Todo deleted successfully', id: req.params.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
});
