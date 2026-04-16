import { Request, Response } from "express";
import authService from "../services/auth.service.js";

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const result = authService.login({ username, password });
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json({ error: result.error });
  }
};

export const getUsers = (req: Request, res: Response) => {
  try {
    const users = authService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createUser = (req: Request, res: Response) => {
  const { username, display_name, password, role_id } = req.body;
  
  if (!username || !display_name || !role_id) {
    res.status(400).json({ error: "Username, display_name, and role_id are required" });
    return;
  }

  const result = authService.createUser({ username, display_name, password, role_id });
  
  if (result.success) {
    res.json({ success: true, id: result.id });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const updateUser = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { username, display_name, password, role_id, status } = req.body;
  
  const result = authService.updateUser(id, { username, display_name, password, role_id, status });
  
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const deleteUser = (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const result = authService.deleteUser(id);
  
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
};