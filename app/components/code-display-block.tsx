interface CodeDisplayBlockProps {
  code: string;
  lang: string;
}

export default function CodeDisplayBlock({ code, lang }: CodeDisplayBlockProps) {
  return <code className="block rounded-md bg-muted p-4 text-sm">{code}</code>;
}
