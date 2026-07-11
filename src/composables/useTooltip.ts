import { ref } from 'vue';

export function useTooltip() {
  const showTooltip = ref(false);

  const handleMouseOver = () => {
    showTooltip.value = true;
  };

  const handleMouseLeave = () => {
    showTooltip.value = false;
  };

  return {
    showTooltip,
    handleMouseOver,
    handleMouseLeave,
  };
}
