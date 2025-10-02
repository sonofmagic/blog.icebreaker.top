const STATE_KEY = 'device:isMobile'

export function useDevice() {
  const isMobile = useState<boolean>(STATE_KEY, () => false)

  function setIsMobile(value: boolean) {
    isMobile.value = value
  }

  return {
    isMobile,
    setIsMobile,
  }
}
