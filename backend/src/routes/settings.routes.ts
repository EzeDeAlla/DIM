import { Router } from "express";
import { SettingsController } from "../settings/settings.controller";
import { jwtMiddleware } from "../middleware/jwt.middleware";
import { validateContentType } from "../middleware/content-type.middleware";

const router = Router();
const ctrl = new SettingsController();

// Aplicar middleware JWT y Content-Type a todas las rutas
router.use(jwtMiddleware);
router.use(validateContentType);

router.get("/", ctrl.getAll);
router.put("/:key", ctrl.update);

export default router;