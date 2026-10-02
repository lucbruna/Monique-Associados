import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getStats,
  getCaseTypeDistribution,
  getMonthlyActivity,
  getFinancialSummary,
  getRevenueTrend,
  getWorkload,
  getDeadlineHealth,
  getCaseStatusDistribution,
} from '../controllers/dashboard.controller';

const router = Router();
router.use(authenticate);

router.get('/stats', getStats);
router.get('/case-type-distribution', getCaseTypeDistribution);
router.get('/monthly-activity', getMonthlyActivity);
router.get('/financial-summary', getFinancialSummary);
router.get('/revenue-trend', getRevenueTrend);
router.get('/workload', getWorkload);
router.get('/deadline-health', getDeadlineHealth);
router.get('/case-status-distribution', getCaseStatusDistribution);

export default router;
