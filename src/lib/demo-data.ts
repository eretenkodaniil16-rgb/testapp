import type { PracticeQuestion } from "@/types/domain";

export const demoQuestions: PracticeQuestion[] = [
  {
    id: "q-apoptosis-01",
    revisionId: "q-apoptosis-01-r1",
    subjectId: "pathology",
    topicId: "cell-injury",
    subject: "Патологическая анатомия",
    topic: "Повреждение клетки",
    type: "single_choice",
    prompt: "Как называется регулируемая форма клеточной гибели, обычно протекающая без выраженной воспалительной реакции?",
    explanation: "Апоптоз — программируемая клеточная гибель с контролируемой фрагментацией клетки и последующим удалением её компонентов.",
    options: [
      { id: "a", label: "A", text: "Некроз", correct: false },
      { id: "b", label: "B", text: "Апоптоз", correct: true },
      { id: "c", label: "C", text: "Метаплазия", correct: false },
      { id: "d", label: "D", text: "Гиперплазия", correct: false }
    ]
  },
  {
    id: "q-nephron-01",
    revisionId: "q-nephron-01-r1",
    subjectId: "histology",
    topicId: "kidney",
    subject: "Гистология",
    topic: "Почка",
    type: "single_choice",
    prompt: "Что является структурно-функциональной единицей почки?",
    explanation: "Нефрон включает почечное тельце и систему канальцев и является структурно-функциональной единицей почки.",
    options: [
      { id: "a", label: "A", text: "Ацинус", correct: false },
      { id: "b", label: "B", text: "Нефрон", correct: true },
      { id: "c", label: "C", text: "Остеон", correct: false },
      { id: "d", label: "D", text: "Долька печени", correct: false }
    ]
  },
  {
    id: "q-ap-phases-01",
    revisionId: "q-ap-phases-01-r1",
    subjectId: "physiology",
    topicId: "membrane-potential",
    subject: "Физиология",
    topic: "Потенциал действия",
    type: "multiple_choice",
    prompt: "Какие процессы непосредственно участвуют в формировании типичного потенциала действия возбудимой клетки? Выберите все подходящие ответы.",
    explanation: "Потенциал действия формируется за счёт последовательных изменений проницаемости мембраны для ионов, прежде всего через потенциал-зависимые каналы.",
    options: [
      { id: "a", label: "A", text: "Изменение мембранной проницаемости для Na⁺", correct: true },
      { id: "b", label: "B", text: "Изменение мембранной проницаемости для K⁺", correct: true },
      { id: "c", label: "C", text: "Необратимое разрушение мембраны", correct: false },
      { id: "d", label: "D", text: "Работа потенциал-зависимых ионных каналов", correct: true }
    ]
  },
  {
    id: "q-thrombus-01",
    revisionId: "q-thrombus-01-r1",
    subjectId: "pathology",
    topicId: "circulation",
    subject: "Патологическая анатомия",
    topic: "Нарушения кровообращения",
    type: "single_choice",
    prompt: "Как называется прижизненное свёртывание крови в просвете сосуда или полости сердца?",
    explanation: "Тромбоз — прижизненное образование свёртка крови в сосудистой системе или полостях сердца.",
    options: [
      { id: "a", label: "A", text: "Эмболия", correct: false },
      { id: "b", label: "B", text: "Тромбоз", correct: true },
      { id: "c", label: "C", text: "Гемолиз", correct: false },
      { id: "d", label: "D", text: "Диапедез", correct: false }
    ]
  }
];

export const subjects = [
  { id: "pathology", title: "Патологическая анатомия", questionCount: 428 },
  { id: "physiology", title: "Физиология", questionCount: 713 },
  { id: "histology", title: "Гистология", questionCount: 306 }
];
