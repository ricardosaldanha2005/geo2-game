import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface QuizProps {
  onClose: () => void
}

// Perguntas mockadas para demonstração
const mockQuestions = [
  {
    question: "Qual é a capital de Portugal?",
    options: ["Porto", "Lisboa", "Coimbra", "Braga"],
    correct: "Lisboa"
  },
  {
    question: "Em que ano Portugal conquistou a independência?",
    options: ["1143", "1249", "1385", "1495"],
    correct: "1143"
  },
  {
    question: "Qual é o rio mais importante de Portugal?",
    options: ["Douro", "Tejo", "Guadiana", "Minho"],
    correct: "Tejo"
  },
  {
    question: "Qual é o prato típico português mais conhecido?",
    options: ["Bacalhau", "Francesinha", "Pastel de Nata", "Caldo Verde"],
    correct: "Bacalhau"
  }
]

export function QuizCard({ onClose }: QuizProps) {
  const { user } = useAuth()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [loading, setLoading] = useState(false)

  // Selecionar uma pergunta aleatória
  const randomQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)]

  const handleAnswer = async (answer: string) => {
    if (answered || !user) return

    setSelectedAnswer(answer)
    setAnswered(true)
    setCorrect(answer === randomQuestion.correct)
    setLoading(true)

    try {
      // Salvar resposta no banco
      const { error } = await supabase
        .from('quiz')
        .insert({
          question: randomQuestion.question,
          correct_answer: randomQuestion.correct,
          options: randomQuestion.options,
          team_id: 'green', // Fallback para equipe padrão
          player_id: user.id,
          points: answer === randomQuestion.correct ? 10 : 0,
          answered: true
        })

      if (error) throw error

      // Atualizar score do usuário se acertou
      if (answer === randomQuestion.correct) {
        const { error: scoreError } = await supabase
          .from('users')
          .update({ score: 10 }) // Incremento fixo de 10 pontos
          .eq('id', user.id)

        if (scoreError) throw scoreError
      }
    } catch (error) {
      console.error('Erro ao salvar quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">🎯 Quiz do Território</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-white mb-4">{randomQuestion.question}</p>
          
          <div className="space-y-3">
            {randomQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={answered || loading}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  answered
                    ? option === randomQuestion.correct
                      ? 'bg-green-600 text-white'
                      : option === selectedAnswer
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {answered && (
          <div className={`p-4 rounded-lg mb-4 ${
            correct ? 'bg-green-600 bg-opacity-20 border border-green-400' : 'bg-red-600 bg-opacity-20 border border-red-400'
          }`}>
            <p className={`text-center font-semibold ${
              correct ? 'text-green-400' : 'text-red-400'
            }`}>
              {correct ? '✅ Correto! +10 pontos' : '❌ Incorreto!'}
            </p>
            <p className="text-center text-gray-300 mt-2">
              Resposta correta: {randomQuestion.correct}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            {answered ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}
