/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { QuestionType, MultipleChoiceGradingPolicyType } from '@prisma/client'

class GradingPolicy {
  static policies = {
    [QuestionType.multipleChoice]: [],
  }

  constructor({ label, documentation, policyType }) {
    this.label = label
    this.documentation = documentation
    this.policyType = policyType
  }

  static addPolicy(policy) {
    if (!GradingPolicy.policies[policy.constructor.questionType]) {
      GradingPolicy.policies[policy.constructor.questionType] = []
    }
    GradingPolicy.policies[policy.constructor.questionType].push(policy)
  }

  static getPolicy(questionType, policyType) {
    return (
      GradingPolicy.getPolicies(questionType)?.find(
        (policy) => policy.policyType === policyType,
      ) || null
    )
  }

  static getPoliciesDict(questionType) {
    return GradingPolicy.policies[questionType].map((policy) => {
      return {
        label: policy.label,
        value: policy.policyType,
      }
    })
  }

  static getPolicies(questionType) {
    return GradingPolicy.policies[questionType]
  }

  extract(solution, answer) {
    throw new Error('Not implemented')
  }

  calculate(data) {
    throw new Error('Not implemented')
  }

  breakdown(data) {
    throw new Error('Not implemented')
  }

  getConfigComponent(props) {
    return null // Default implementation, no configuration component
  }
}

class MultipleChoicePolicy extends GradingPolicy {
  static questionType = QuestionType.multipleChoice
}

class MultipleChoiceAllOrNothingPolicy extends MultipleChoicePolicy {
  constructor({ label, documentation }) {
    super({
      label,
      documentation,
      policyType: MultipleChoiceGradingPolicyType.ALL_OR_NOTHING,
    })
    MultipleChoicePolicy.addPolicy(this)
  }

  extract(solution, answer) {
    const correctOptions = solution.options.filter((option) => option.isCorrect)

    const selectedOptions = answer.options

    const incorrectOptions = solution.options.filter(
      (option) => !option.isCorrect,
    )

    const selectedCorrectOptions = answer.options.filter((answer) =>
      correctOptions.some((option) => option.id === answer.id),
    )

    const selectedIncorrectOptions = answer.options.filter((answer) =>
      incorrectOptions.some((option) => option.id === answer.id),
    )

    return {
      selectedOptions: selectedOptions,
      correctOptions: correctOptions,
      incorrectOptions: incorrectOptions.length,
      selectedCorrectOptions: selectedCorrectOptions.length,
      selectedIncorrectOptions: selectedIncorrectOptions.length,
    }
  }

  calculate({ solution, answer, totalPoints }) {
    const { selectedOptions, correctOptions } = this.extract(solution, answer)

    const isAllCorrect =
      correctOptions.length === selectedOptions.length &&
      correctOptions.every((opt) =>
        selectedOptions.some((aOpt) => aOpt.id === opt.id),
      )

    const finalScore = isAllCorrect ? totalPoints : 0

    return { finalScore, isCorrect: isAllCorrect }
  }

  breakdown({ solution, answer, totalPoints }) {
    const {
      correctOptions,
      incorrectOptions,
      selectedCorrectOptions,
      selectedIncorrectOptions,
    } = this.extract(solution, answer)

    const { finalScore } = this.calculate({ solution, answer, totalPoints })

    const allCorrectOptionsSelected =
      selectedCorrectOptions === correctOptions.length &&
      selectedIncorrectOptions === 0

    return {
      finalScore,
      breakdown: `### All-Or-Nothing Policy Calculation Breakdown

#### Variables
- Total Points: **${totalPoints}**
- **Total Correct Options**: **${correctOptions.length}**
- **Total Incorrect Options**: **${incorrectOptions}**
- **Selected Correct Options**: **${selectedCorrectOptions}**
- **Selected Incorrect Options**: **${selectedIncorrectOptions}**

#### Final Score Formula:
\`\`\`katex
\\text{Final Score} = 
\\begin{cases} 
\\text{Total Points} & \\text{if All Correct Options and No Incorrect Options} \\\\
0 & \\text{otherwise}
\\end{cases}
\`\`\`

#### Calculation Breakdown:
- All Correct Options Selected: **${allCorrectOptionsSelected ? 'Yes' : 'No'}**
- Any Incorrect Options Selected: **${
        selectedIncorrectOptions > 0 ? 'Yes' : 'No'
      }**
- **Final Score**: **${finalScore.toFixed(2)}**
            `,
    }
  }
}
class MultipleChoiceGradualCreditPolicy extends MultipleChoicePolicy {
  constructor({ label, documentation }) {
    super({
      label,
      documentation,
      policyType: MultipleChoiceGradingPolicyType.GRADUAL_CREDIT,
    })
    MultipleChoicePolicy.addPolicy(this)
  }

  extract(solution, answer) {
    const totalOptions = solution.options.length

    const correctOptions = solution.options.filter((option) => option.isCorrect)
    const incorrectOptions = solution.options.filter(
      (option) => !option.isCorrect,
    )

    const selectedCorrectOptions = answer.options.filter((answer) =>
      correctOptions.some((option) => option.id === answer.id),
    )

    const selectedIncorrectOptions = answer.options.filter((answer) =>
      incorrectOptions.some((option) => option.id === answer.id),
    )

    const unselectedCorrectOptions = correctOptions.filter(
      (option) => !answer.options.some((answer) => answer.id === option.id),
    )

    const unselectedIncorrectOptions = incorrectOptions.filter(
      (option) => !answer.options.some((answer) => answer.id === option.id),
    )

    return {
      totalOptions: totalOptions,
      correctOptions: correctOptions.length,
      selectedCorrectOptions: selectedCorrectOptions.length,
      unselectedCorrectOptions: unselectedCorrectOptions.length,
      incorrectOptions: incorrectOptions.length,
      selectedIncorrectOptions: selectedIncorrectOptions.length,
      unselectedIncorrectOptions: unselectedIncorrectOptions.length,
    }
  }

  calculate({ solution, answer, totalPoints }) {
    const { totalOptions, selectedCorrectOptions, unselectedIncorrectOptions } =
      this.extract(solution, answer, totalPoints)

    // Correct selection is the sum of correct options and unselected incorrect options
    const correctSelections =
      selectedCorrectOptions + unselectedIncorrectOptions

    const correctnessRatio = correctSelections / totalOptions

    // Calculate final score
    const finalScore = correctnessRatio * totalPoints

    return {
      finalScore: Math.round(finalScore * 100) / 100, // Round to two decimal places
      correctnessRatio,
    }
  }

  breakdown({ solution, answer, totalPoints }) {
    const {
      totalOptions,
      selectedCorrectOptions,
      unselectedIncorrectOptions, // Correct variable
    } = this.extract(solution, answer, totalPoints)

    // Extract final score and correctness ratio from the calculate function
    const { finalScore, correctnessRatio } = this.calculate({
      solution,
      answer,
      totalPoints,
    })

    return {
      finalScore,
      breakdown: `### Multiple-Choice Gradual Credit Policy Breakdown
  #### Variables
  - **Total Points**: **${totalPoints}**
  - **Correct Choices Selected (CCS)**: **${selectedCorrectOptions}**
  - **Incorrect Choices Unselected (ICU)**: **${unselectedIncorrectOptions}** 
  - **Total Options (TO)**: **${totalOptions}**
  - **Correctness Ratio (CR)**: **${correctnessRatio.toFixed(2)}**
  
  #### Calculation Breakdown:
  
  \`\`\`katex
  \\large
  \\text{Correctness Ratio (CR)} = \\frac{CCS + ICU}{TO} = \\frac{${selectedCorrectOptions} + ${unselectedIncorrectOptions}}{${totalOptions}} = ${correctnessRatio.toFixed(2)}
  \`\`\`
  
  \`\`\`katex
  \\large
  \\text{Final Score} = \\text{CR} \\times \\text{Total Points} = ${correctnessRatio.toFixed(2)} \\times ${totalPoints} = ${finalScore.toFixed(2)}
  \`\`\`
  
  #### Final Score: ${finalScore.toFixed(2)} pts
      `,
    }
  }
}

new MultipleChoiceAllOrNothingPolicy({
  label: 'All or Nothing',
  documentation: `**All or Nothing** awards full points if all correct options are selected and no incorrect options are selected.
`,
})

new MultipleChoiceGradualCreditPolicy({
  label: 'Gradual Credit',
  documentation: `
**Gradual Credit** awards points based on the student's selection of correct and incorrect options:

- **CR** = Correctness Ratio
- **CCS** = Correct Choices Selected
- **ICU** = Incorrect Choices Unselected
- **TO** = Total Options (Correct + Incorrect)

**Correctness Ratio (CR) Calculation**:

\`\`\`katex
\\large
\\text{CR} = \\frac{CCS + ICU}{TO}
\`\`\`

**Final Score Calculation**:

\`\`\`katex
\\large
\\text{Final Score} = \\text{CR} \\times \\text{Total Points} = \\frac{CCS + ICU}{TO} \\times \\text{Total Points}
\`\`\`
`,
})

export default GradingPolicy
