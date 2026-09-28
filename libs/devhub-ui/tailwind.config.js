import preset from '@berrypjh/react-ui/tailwind';

/**
 * Storybook 전용. 이 패키지는 dist 로 소비될 때 Tailwind 설정을 갖지 않는다(그건 앱의 몫이다) —
 * 여기 config 는 `.storybook/preview.css` 가 `@config` 로 부르는, 컴포넌트를 눈으로 볼 때만 쓰는 설정이다.
 * @type {import('tailwindcss').Config}
 */
export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
};
