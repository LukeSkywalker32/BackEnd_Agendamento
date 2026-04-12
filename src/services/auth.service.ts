import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { RefreshToken } from "../models/RefreshToken";
import { User } from "../models/User";
import type { JwtPayload, UserRole } from "../types";
import { ApiError } from "../utils/apiError";
import { cleanCNPJ, isValidCNPJ } from "../utils/cnpj";

interface RegisterData {
   name: string;
   email: string;
   password: string;
   role: UserRole;
   document: string;
   phone?: string;
}

interface LoginData {
   email: string;
   password: string;
}

interface TokenPair {
   accessToken: string;
   refreshToken: string;
}

//Gera o token de acesso
function generateAccessToken(payload: JwtPayload): string {
   return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
   });
}

async function generateRefreshToken(userId: string): Promise<string> {
   const token = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
   });

   const expiresAt = new Date();
   expiresAt.setDate(expiresAt.getDate() + 7);

   await RefreshToken.create({
      userId,
      token,
      expiresAt,
   });

   return token;
}

export async function register(data: RegisterData) {
   const existingUser = await User.findOne({ email: data.email });
   if (existingUser) {
      throw ApiError.conflict("E-mail já cadastrado");
   }

   if (data.role !== "admin") {
      const cleanDoc = cleanCNPJ(data.document);
      if (!isValidCNPJ(cleanDoc)) {
         throw ApiError.badRequest("CNPJ inválido");
      }
      data.document = cleanDoc;

      const existingDoc = await User.findOne({ document: cleanDoc });
      if (existingDoc) {
         throw ApiError.conflict("CNPJ já cadastrado");
      }
   }

   const hashedPassword = await bcrypt.hash(data.password, 10);

   const user = await User.create({
      ...data,
      password: hashedPassword,
   });

   const { password: _, ...userWithoutPassword } = user.toObject();

   return userWithoutPassword;
}

export async function login(data: LoginData): Promise<{ user: object; tokens: TokenPair }> {
   const user = await User.findOne({ email: data.email, isActive: true }).select("+password");

   if (!user) {
      throw ApiError.unauthorized("E-mail ou senha incorretos");
   }

   const isPasswordValid = await bcrypt.compare(data.password, user.password);

   if (!isPasswordValid) {
      throw ApiError.unauthorized("E-mail ou senha incorretos");
   }

   const payload: JwtPayload = {
      userId: String(user._id),
      role: user.role,
   };

   const accessToken = generateAccessToken(payload);
   const refreshToken = await generateRefreshToken(String(user._id));

   const { password: _, ...userWithoutPassword } = user.toObject();

   return {
      user: userWithoutPassword,
      tokens: { accessToken, refreshToken },
   };
}

export async function refreshAccessToken(token: string): Promise<TokenPair> {
   const storedToken = await RefreshToken.findOne({ token });

   if (!storedToken) {
      throw ApiError.unauthorized("Refresh token inválido");
   }

   if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      throw ApiError.unauthorized("Refresh token expirado");
   }

   try {
      jwt.verify(token, env.JWT_REFRESH_SECRET);
   } catch {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      throw ApiError.unauthorized("Refresh token inválido");
   }

   const user = await User.findById(storedToken.userId);

   if (!user || !user.isActive) {
      throw ApiError.unauthorized("Usuário não encontrado ou inativo");
   }

   await RefreshToken.deleteOne({ _id: storedToken._id });

   const payload: JwtPayload = {
      userId: String(user._id),
      role: user.role,
   };

   const accessToken = generateAccessToken(payload);
   const newRefreshToken = await generateRefreshToken(String(user._id));

   return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string): Promise<void> {
   await RefreshToken.deleteOne({ token });
}
