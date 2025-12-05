/**
 * Evaluates whether a question should be shown based on conditional rules
 * This function must work identically on frontend and backend
 * @param {Object} rules - The conditional rules object
 * @param {Object} answersSoFar - Object containing answers keyed by questionKey
 * @returns {boolean} - Whether the question should be shown
 */
export function shouldShowQuestion(rules, answersSoFar) {
  // If no rules, always show
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const results = rules.conditions.map(condition => {
    const answer = answersSoFar[condition.questionKey];
    
    // Handle missing values - condition is not met if answer is missing
    if (answer === undefined || answer === null) {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        // Handle array comparison for multipleSelects
        if (Array.isArray(answer) && Array.isArray(condition.value)) {
          return JSON.stringify(answer.sort()) === JSON.stringify(condition.value.sort());
        }
        return answer === condition.value;
        
      case 'notEquals':
        if (Array.isArray(answer) && Array.isArray(condition.value)) {
          return JSON.stringify(answer.sort()) !== JSON.stringify(condition.value.sort());
        }
        return answer !== condition.value;
        
      case 'contains':
        if (Array.isArray(answer)) {
          return answer.includes(condition.value);
        }
        return String(answer).includes(String(condition.value));
        
      default:
        return false;
    }
  });

  // Combine results based on logic operator
  if (rules.logic === 'AND') {
    return results.every(r => r === true);
  } else if (rules.logic === 'OR') {
    return results.some(r => r === true);
  }

  // Default to showing if logic is not specified
  return true;
}

export default shouldShowQuestion;
