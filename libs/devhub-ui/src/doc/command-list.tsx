import { CopyButton } from './copy-button';

/**
 * 명령 여러 줄을 한 블록에. 줄마다 복사 버튼이 오른쪽에 붙는다.
 * 어절(공백 단위)을 끊지 않고 줄을 바꾸며, 이어지는 줄은 들여 써서 한 명령임을 보인다.
 */
export const CommandList = ({
  commands,
  label,
  copyLabel,
}: {
  commands: readonly string[];
  label: string;
  copyLabel: (command: string) => string;
}) => (
  <ul
    aria-label={label}
    className="divide-y divide-stroke-light rounded-sm border border-stroke-light bg-background-default"
  >
    {commands.map((command) => (
      <li key={command} className="flex items-center gap-xs py-2xs pr-2xs pl-sm">
        <code className="devhub-code min-w-0 flex-1 py-2xs pl-md -indent-md">
          {command.split(' ').map((word, index) => (
            <span key={index}>
              {index > 0 && ' '}
              <span className="inline-block max-w-full indent-0">{word}</span>
            </span>
          ))}
        </code>
        <span className="shrink-0">
          <CopyButton text={command} label={copyLabel(command)} />
        </span>
      </li>
    ))}
  </ul>
);
