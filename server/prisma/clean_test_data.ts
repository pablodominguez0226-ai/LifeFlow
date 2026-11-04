import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Reinicio de Datos a Cero (Fresh Start) ---');

  // 1. Eliminar TimeBlocks y Eventos viejos de prueba
  const deletedBlocks = await prisma.scheduleBlock.deleteMany();
  console.log(`Eliminados ScheduleBlocks: ${deletedBlocks.count}`);

  const deletedWeeklyPlans = await prisma.weeklyPlan.deleteMany();
  console.log(`Eliminados WeeklyPlans: ${deletedWeeklyPlans.count}`);

  // 2. Eliminar tareas pasadas
  const deletedTasks = await prisma.academicTask.deleteMany();
  console.log(`Eliminados AcademicTasks: ${deletedTasks.count}`);

  // 3. Eliminar check-ins y bitácoras pasadas
  const deletedCheckIns = await prisma.dailyCheckIn.deleteMany();
  console.log(`Eliminados DailyCheckIns: ${deletedCheckIns.count}`);

  const deletedJournals = await prisma.journalEntry.deleteMany();
  console.log(`Eliminados JournalEntries: ${deletedJournals.count}`);

  // 4. Eliminar registros de hábitos (HabitLog) y resetear rachas a 0
  const deletedHabitLogs = await prisma.habitLog.deleteMany();
  console.log(`Eliminados HabitLogs: ${deletedHabitLogs.count}`);

  const updatedHabits = await prisma.habit.updateMany({
    data: {
      streak: 0,
    },
  });
  console.log(`Hábitos reseteados con racha a 0: ${updatedHabits.count}`);

  // 5. Eliminar recomendaciones viejas
  const deletedRecommendations = await prisma.recommendation.deleteMany();
  console.log(`Eliminadas Recommendations: ${deletedRecommendations.count}`);

  console.log('--- Limpieza completada con éxito. Estructura de usuario preservada. ---');
}

main()
  .catch((e) => {
    console.error('Error al limpiar datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
