"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IcalService = void 0;
const ical_generator_1 = __importStar(require("ical-generator"));
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
class IcalService {
    /**
     * Generates a standard RFC 5545 iCalendar (.ics) string containing
     * all scheduled blocks for the given user within the specified window.
     */
    static async generateIcsFeed(userId, options = {}) {
        const user = userId
            ? await prisma.user.findUnique({ where: { id: userId } })
            : await prisma.user.findFirst();
        if (!user) {
            throw new Error('Usuario no encontrado para generar el feed de calendario.');
        }
        const pastDays = options.pastDays ?? 14; // Include 2 weeks of history
        const futureDays = options.futureDays ?? 60; // Include next 2 months of planning
        const now = new Date();
        const fromDate = (0, date_fns_1.subDays)(now, pastDays);
        const toDate = (0, date_fns_1.addDays)(now, futureDays);
        const blocks = await prisma.scheduleBlock.findMany({
            where: {
                userId: user.id,
                startTime: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            include: {
                activity: true,
                academicTask: {
                    include: {
                        subject: true,
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });
        const calendar = (0, ical_generator_1.default)({
            name: 'LifeFlow Agenda Personal',
            description: 'Agenda inteligente y planning engine sincronizado de LifeFlow (Academia, Gimnasio, Hábitos y Descanso)',
            method: ical_generator_1.ICalCalendarMethod.PUBLISH,
            timezone: 'America/Argentina/Buenos_Aires',
            prodId: {
                company: 'LifeFlow',
                product: 'LifeFlow Agenda Personal',
                language: 'ES',
            },
        });
        for (const block of blocks) {
            // Build clear, informative description with flexibility and cognitive justification
            const descLines = [
                `📌 Categoría: ${block.category}`,
                `🔒 Flexibilidad: ${block.flexibility}${block.isFixed ? ' (Bloque Fijo Inamovible)' : ' (Reubicable)'}`,
                `⚡ Exigencia de Energía: ${block.energyLevel}`,
            ];
            if (block.academicTask?.subject) {
                descLines.push(`📚 Asignatura: ${block.academicTask.subject.name}`);
            }
            if (block.justification) {
                descLines.push(`🎯 Justificación Cognitiva: ${block.justification}`);
            }
            if (block.status) {
                descLines.push(`📊 Estado: ${block.status}`);
            }
            let location = '';
            if (block.category === 'ACADEMIA')
                location = 'Facultad';
            else if (block.category === 'GIMNASIO')
                location = 'Gimnasio';
            else if (block.category === 'DEPORTE')
                location = 'Club / Cancha';
            calendar.createEvent({
                id: `${block.id}@lifeflow.app`,
                start: block.startTime,
                end: block.endTime,
                summary: `[${block.category}] ${block.title}`,
                description: descLines.join('\n'),
                location: location || undefined,
                categories: [{ name: block.category }],
            });
        }
        return calendar.toString();
    }
}
exports.IcalService = IcalService;
