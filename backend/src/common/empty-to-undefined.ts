import { Transform } from 'class-transformer';

/**
 * Los formularios del frontend mandan campos opcionales vacíos como cadena vacía
 * ('') en vez de omitirlos. @IsOptional() de class-validator solo salta la validación
 * cuando el valor es undefined/null, así que un validador estricto como @IsEmail()
 * seguía rechazando '' como formato inválido. Este decorador normaliza '' a undefined
 * antes de validar, para que "opcional" funcione de verdad.
 */
export const EmptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value));
