import { ZodError } from 'zod';
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map(e => ({
                    campo: e.path.join('.'),
                    tipo: e.code,
                    detalle: e.message,
                    esperado: e.expected ?? null,
                    recibido: e.received ?? null
                }));
                console.error('Error de validación:', formattedErrors);
                res.status(400).json({
                    exito: false,
                    mensaje: 'Error de validación en los datos enviados',
                    errores: formattedErrors,
                    totalErrores: formattedErrors.length,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                console.error('Error inesperado:', error);
                res.status(500).json({
                    exito: false,
                    mensaje: 'Error interno en la validación',
                    detalle: error.message
                });
            }
        }
    };
};
