declare module "mammoth/mammoth.browser" {
  const mammoth: {
    convertToHtml: (
      input: { arrayBuffer: ArrayBuffer },
      options?: Record<string, unknown>
    ) => Promise<{ value: string; messages: unknown[] }>;
    images: {
      imgElement: (fn: (image: { readAsBase64String: () => Promise<string> }) => Promise<{ src: string }>) => unknown;
    };
  };
  export default mammoth;
}
