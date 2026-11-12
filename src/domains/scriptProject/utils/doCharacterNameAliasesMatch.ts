const NUMBER_WORD_PATTERN = /^#?\d+$/;

export const doCharacterNameAliasesMatch = (
  firstAliasWords: string[],
  secondAliasWords: string[]
): boolean => {
  const isEitherAliasEmpty =
    !firstAliasWords.length || !secondAliasWords.length;
  if (isEitherAliasEmpty) return false;
  const [shorterAliasWords, longerAliasWords] =
    firstAliasWords.length <= secondAliasWords.length
      ? [firstAliasWords, secondAliasWords]
      : [secondAliasWords, firstAliasWords];
  const isShorterAliasPrefixOfLonger = shorterAliasWords.every(
    (word, wordIndex) => word === longerAliasWords[wordIndex]
  );
  const doesLongerAliasAddCharacterNumber = longerAliasWords
    .slice(shorterAliasWords.length)
    .some((word) => NUMBER_WORD_PATTERN.test(word));
  return isShorterAliasPrefixOfLonger && !doesLongerAliasAddCharacterNumber;
};
