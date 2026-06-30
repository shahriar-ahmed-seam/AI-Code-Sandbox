export const SAMPLES: Record<string, string> = {
  python: `# Python 3.12 — runs in an isolated container
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print("First 10 Fibonacci numbers:")
print([fib(i) for i in range(10)])
`,
  node: `// Node.js 20 — runs in an isolated container
const fib = (n) => {
  let [a, b] = [0n, 1n];
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
};

console.log("2^64 =", (2n ** 64n).toString());
console.log("fib(50) =", fib(50).toString());
`,
  go: `// Go 1.22 — runs in an isolated container
package main

import "fmt"

func main() {
	sum := 0
	for i := 1; i <= 100; i++ {
		sum += i
	}
	fmt.Println("Sum 1..100 =", sum)
}
`,
};

export const DEFAULT_LANGUAGE = "python";
