import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { error } from 'node:console';

const routes = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is required to use the authentication API.');
    }
    return secret;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Lỗi máy chủ không xác định.';
}

function normalizeEmail(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

routes.post('/register', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';

    if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rowCount) {
            return res.status(409).json({ error: 'Email này đã được đăng ký.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `user_${randomUUID()}`;
        const result = await pool.query(
            `INSERT INTO users (id, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name`,
            [userId, email, passwordHash, fullName],
        );
        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), { expiresIn: '7d' });

        return res.status(201).json({ success: true, token, user });
    } catch (error: unknown) {
        console.error('Registration failed:', error);
        return res.status(500).json({ error: getErrorMessage(error) });
    }
});

routes.post('/login', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
    }

    try {
        const result = await pool.query(
            'SELECT id, email, password_hash, full_name,role,status FROM users WHERE email = $1',
            [email],
        );
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: "mat khau hoac email khong dung" })
        }
        if (user.status !== 'active') {
            return res.status(403).json({
                error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.'
            })
        }
        // if(user.role !== 'admin'){
        //     return res.status(403).json({
        //         error: 'Bạn không có quyền truy cập vào trang quản trị.'
        //     })
        // }
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
        }

        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        },
            getJwtSecret(), { expiresIn: '7d' });
        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        });
    } catch (error: unknown) {
        console.error('Login failed:', error);
        return res.status(500).json({ error: getErrorMessage(error) });
    }
});

export default routes;
