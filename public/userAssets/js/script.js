function moveFocus(currentInput) {
    if (currentInput.value.length === currentInput.maxLength) {
      const nextInput = currentInput.nextElementSibling;
      if (nextInput) {
        nextInput.focus();
      }
    } else if (currentInput.value.length === 0) {
      const previousInput = currentInput.previousElementSibling;
      if (previousInput) {
        previousInput.focus();
      }
    }
  }
  