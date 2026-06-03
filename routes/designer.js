const router = require('express').Router();

const { createDesingner } = require('../controller/designer')
/**
 * @swagger
 * tags:
 *   name: Designer
 *   description: API endpoints for Designer management
 */

router.post('/', createDesingner);
/**
 * @swagger
 * /api/v1/designer:
 *   post:
 *     tags:
 *       - Designer
 *     summary: Designer registration
 *     description: Register a new Designer with name, email, phone number, password, and confirm password
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema: 
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string  
 *                 description: The Designer's First Name
 *                 example: John
 *               lastName:
 *                 type: string  
 *                 description: The Designer's Last Name
 *                 example: Doe
 *               email:
 *                 type: string
 *                 description: The Designer's Email
 *                 example: example@example.com
 *               password:
 *                 type: string
 *                 description: The Designer's Password
 *                 example: password123
 *     responses:
 *       201:
 *         description: Designer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *                   example: Designer created successfully
 */
module.exports = router