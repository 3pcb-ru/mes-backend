import { ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { JwtUser } from '@/types/jwt.types';

import { IS_PUBLIC_KEY } from '../decorators/public.decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector,
        private readonly logger: CustomLoggerService,
    ) {
        super();
        this.logger.setContext(JwtAuthGuard.name);
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        try {
            const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
            if (isPublic) return true;

            const request = context.switchToHttp().getRequest<Request>();

            const authHeader = (request.headers as Record<string, unknown>)['authorization'] as string | undefined;
            if (!authHeader) throw new UnauthorizedException('Missing authorization header');

            if (!authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedException('Invalid authorization header format');
            }

            return super.canActivate(context);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                this.logger.warn('JWT Guard activation unauthorized:', {
                    message: error.message,
                    context: {
                        class: context.getClass().name,
                        handler: context.getHandler().name,
                    },
                });
            } else {
                this.logger.error('JWT Guard activation failed:', {
                    error: (error as Error).message,
                    stack: (error as Error).stack,
                    context: {
                        class: context.getClass().name,
                        handler: context.getHandler().name,
                    },
                });
            }
            throw error;
        }
    }

    handleRequest<T extends JwtUser>(err: Error | null, user: T | false, info: Error | undefined, context: ExecutionContext, _status?: unknown): T {
        try {
            if (err) {
                this.logger.error('JWT validation error:', { error: err.message, stack: err.stack });
                throw err;
            }

            if (!user) {
                const message = info?.message || 'Unauthorized access';
                throw new UnauthorizedException(message);
            }

            if (!this.validateUserObject(user)) {
                this.logger.error('Invalid user object structure:', { user });
                throw new InternalServerErrorException('Invalid user data structure');
            }

            return user;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                this.logger.warn('JWT request unauthorized:', {
                    message: error.message,
                    context: {
                        class: context.getClass().name,
                        handler: context.getHandler().name,
                    },
                });
            } else {
                this.logger.error('JWT request handling failed:', {
                    error: (error as Error).message,
                    stack: (error as Error).stack,
                    context: {
                        class: context.getClass().name,
                        handler: context.getHandler().name,
                    },
                });
            }
            throw error;
        }
    }

    private validateUserObject(user: unknown): user is JwtUser {
        if (!user || typeof user !== 'object') return false;
        const u = user as Record<string, unknown>;
        return (
            typeof u.id === 'string' &&
            typeof u.email === 'string' &&
            typeof u.roleId === 'string' &&
            (u.firstName === undefined || typeof u.firstName === 'string') &&
            (u.lastName === undefined || typeof u.lastName === 'string')
        );
    }
}
