import { Request, Response } from 'express';
import { z } from 'zod';
import { DataStore } from '../db/mongo';

const contactSubmissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Please enter a valid email address'),
  category: z.enum(['feedback', 'feature_request', 'bug_report', 'general_inquiry', 'enterprise']).default('general_inquiry'),
  subject: z.string().min(3, 'Subject must be at least 3 characters long').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters long').max(3000),
});

export class ContactController {
  public static async submit(req: Request, res: Response): Promise<void> {
    const validated = contactSubmissionSchema.parse(req.body);

    // Save message to contact_submissions collection
    const { insertedId } = await DataStore.insertOne('contact_submissions', {
      ...validated,
      ipAddress: req.ip || 'anonymous',
      userAgent: req.headers['user-agent'] || '',
      createdAt: new Date(),
    });

    console.log(`[Contact Submission] Received from ${validated.email} [${validated.category}]: ${validated.subject} (ID: ${insertedId})`);

    res.status(200).json({
      success: true,
      data: {
        id: insertedId,
        receivedAt: new Date().toISOString(),
      },
      message: 'Thank you for reaching out. Your inquiry has been logged with the Schema Studio engineering team.',
    });
  }
}
