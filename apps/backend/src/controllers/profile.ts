import { Response } from 'express';
import prisma from '../config/db';
import { profileSchema } from '../validators';
import { AuthRequest } from '../middleware/auth';

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        mobileNumber: true,
        address: true,
        businessName: true,
        profileCompleted: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' },
    });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const result = profileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: result.error.errors[0].message },
      });
    }

    const { name, mobileNumber, address, businessName } = result.data;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name,
        mobileNumber,
        address,
        businessName: businessName || null,
        profileCompleted: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobileNumber: true,
        address: true,
        businessName: true,
        profileCompleted: true,
      },
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' },
    });
  }
}
