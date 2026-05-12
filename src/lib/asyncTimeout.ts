/** Promise が ms 以内に解決しないときに拒否する（UI の無限ローディング防止） */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(
        new Error(
          `${label} が ${Math.round(ms / 1000)} 秒以内に完了しませんでした。ネットワークまたは Supabase の応答を確認してください。`
        )
      );
    }, ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}
