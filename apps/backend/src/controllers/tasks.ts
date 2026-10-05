import { Request, Response } from 'express';
import prisma from '../config/db';
import { taskSelectionSchema } from '../validators';
import { AuthRequest } from '../middleware/auth';

export async function getTasks(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' },
    });
  }
}

export async function getSelectedTasks(req: AuthRequest, res: Response) {
  try {
    const userTasks = await prisma.userTask.findMany({
      where: { userId: req.userId },
      include: {
        task: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    const tasks = userTasks.map((ut) => ({
      id: ut.task.id,
      name: ut.task.name,
      description: ut.task.description,
      category: ut.task.category.name,
    }));

    return res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get selected tasks error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' },
    });
  }
}

export async function updateSelectedTasks(req: AuthRequest, res: Response) {
  try {
    const result = taskSelectionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: result.error.errors[0].message },
      });
    }

    const { taskIds } = result.data;

    // Verify all tasks exist
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
    });

    if (tasks.length !== taskIds.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'One or more selected tasks are invalid.' },
      });
    }

    // Replace all user task selections
    await prisma.$transaction([
      prisma.userTask.deleteMany({ where: { userId: req.userId } }),
      ...taskIds.map((taskId) =>
        prisma.userTask.create({
          data: { userId: req.userId!, taskId },
        })
      ),
    ]);

    return res.json({ success: true, message: 'Tasks saved successfully.' });
  } catch (error) {
    console.error('Update selected tasks error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' },
    });
  }
}
