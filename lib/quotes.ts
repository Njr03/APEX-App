export type Quote = {
  quote: string;
  author: string;
};

export const QUOTES: Quote[] = [
  { quote: "Don't count the days. Make the days count.", author: 'Muhammad Ali' },
  { quote: 'I am the greatest. I said that even before I knew I was.', author: 'Muhammad Ali' },
  { quote: "Impossible is not a fact. It's an opinion.", author: 'Muhammad Ali' },
  {
    quote: 'Only a man who knows what it is like to be defeated can reach down and come back.',
    author: 'Muhammad Ali',
  },
  { quote: "It's not bragging if you can back it up.", author: 'Muhammad Ali' },
  {
    quote: 'Everything negative — pressure, challenges — is all an opportunity for me to rise.',
    author: 'Kobe Bryant',
  },
  { quote: "What I'm doing right now, I'm chasing perfection.", author: 'Kobe Bryant' },
  { quote: 'I have nothing in common with lazy people who blame others.', author: 'Kobe Bryant' },
  { quote: 'The moment you give up is the moment you let someone else win.', author: 'Kobe Bryant' },
  { quote: 'Rest at the end. Not in the middle.', author: 'Kobe Bryant' },
  { quote: 'Limits, like fears, are often just an illusion.', author: 'Michael Jordan' },
  { quote: 'I can accept failure. I cannot accept not trying.', author: 'Michael Jordan' },
  {
    quote: 'You have to expect things of yourself before you can do them.',
    author: 'Michael Jordan',
  },
  { quote: 'Some people want it to happen. Others make it happen.', author: 'Michael Jordan' },
  { quote: 'You can have results or excuses. Not both.', author: 'Arnold Schwarzenegger' },
  { quote: 'I am not afraid of dying. I am afraid of not trying.', author: 'Arnold Schwarzenegger' },
  {
    quote: 'The last three or four reps is what makes the muscle grow.',
    author: 'Arnold Schwarzenegger',
  },
  {
    quote: 'Strength does not come from winning. Your struggles develop your strengths.',
    author: 'Arnold Schwarzenegger',
  },
  { quote: 'Be like water.', author: 'Bruce Lee' },
  { quote: 'The successful warrior is the average man, with laser-like focus.', author: 'Bruce Lee' },
  {
    quote: 'Do not pray for an easy life. Pray for strength to endure a difficult one.',
    author: 'Bruce Lee',
  },
  { quote: 'Everyone has a plan until they get punched in the mouth.', author: 'Mike Tyson' },
  { quote: 'Fear is your best friend or your worst enemy. You choose.', author: 'Mike Tyson' },
  { quote: "I'm a dreamer. I have to dream and reach for the stars.", author: 'Mike Tyson' },
  { quote: "There's no talent here. This is hard work. This is obsession.", author: 'Conor McGregor' },
  { quote: "We're not just here to take part. We're here to take over.", author: 'Conor McGregor' },
  { quote: 'Be the hardest worker in the room.', author: 'Dwayne Johnson' },
  { quote: 'All successes begin with self-discipline. It starts with you.', author: 'Dwayne Johnson' },
  { quote: 'Effort is between you and you.', author: 'Ray Lewis' },
  { quote: 'Pain is temporary. Glory is forever.', author: 'Ray Lewis' },
  { quote: 'Winners never quit and quitters never win.', author: 'Vince Lombardi' },
  { quote: 'Once you learn to quit, it becomes a habit.', author: 'Vince Lombardi' },
  {
    quote: 'Perfection is not attainable. But chasing perfection, we catch excellence.',
    author: 'Vince Lombardi',
  },
  { quote: 'Pain is temporary. Quitting lasts forever.', author: 'Lance Armstrong' },
  { quote: "You miss one hundred percent of the shots you don't take.", author: 'Wayne Gretzky' },
  {
    quote: 'Everybody wants to be a bodybuilder. Nobody wants to lift heavy weights.',
    author: 'Ronnie Coleman',
  },
  { quote: 'Winning takes care of everything.', author: 'Tiger Woods' },
  { quote: 'Everything is practice.', author: 'Pelé' },
  { quote: "It's hard to beat a person who never gives up.", author: 'Babe Ruth' },
  { quote: 'A champion is defined not by wins but by how they recover.', author: 'Serena Williams' },
  { quote: 'Stay hard.', author: 'David Goggins' },
  { quote: 'Callous your mind the way you callous your hands.', author: 'David Goggins' },
  { quote: 'You are stopping you. You are giving up instead of getting hard.', author: 'David Goggins' },
  { quote: 'The only way to the other side is through it.', author: 'David Goggins' },
  { quote: 'Discipline equals freedom.', author: 'Jocko Willink' },
  { quote: "Don't count on motivation. Count on discipline.", author: 'Jocko Willink' },
  { quote: 'Good.', author: 'Jocko Willink' },
  { quote: 'The iron never lies to you.', author: 'Henry Rollins' },
  { quote: 'Two hundred pounds is always two hundred pounds.', author: 'Henry Rollins' },
  { quote: 'Obsession is a word the lazy use to describe the dedicated.', author: 'CT Fletcher' },
];

/** Returns a completely random quote every call — no state, no tracking. */
export function getRandomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
