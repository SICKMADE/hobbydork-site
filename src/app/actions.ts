'use server';

export async function handleVaultPinCheck(data: { pin: string }): Promise<{ isCorrect: boolean; reason: string }> {
  if (data.pin === '1981') {
    return { isCorrect: true, reason: 'You have unlocked the vault! A special prize is on its way to your email.' };
  } else {
    return { isCorrect: false, reason: 'Incorrect PIN. The vault remains sealed.' };
  }
}
