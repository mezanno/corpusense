import z from 'zod';
import { Modifier } from './Modifier';

export type AnyModifier = Modifier<z.ZodObject<z.ZodRawShape>>;
