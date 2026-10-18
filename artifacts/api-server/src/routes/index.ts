import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bankMatchRouter from "./bank-match";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bankMatchRouter);

export default router;
