- `react-query`는 서버 상태를 다루는 라이브러리
- `redux`, `mobx` 등은 클라이언트 상태를 다루는 라이브러리

(https://velog.io/@yrnana/react-query가-redux같은-전역-상태관리-라이브러리를-대체할-수-있을까)

---

[Recoil 참고글1](https://velog.io/@juno7803/Recoil-Recoil-200-%ED%99%9C%EC%9A%A9%ED%95%98%EA%B8%B0)
[Recoil 참고글2](https://taegon.kim/archives/10105)

`useRecoilState()` 역할을 반으로 쪼개면

1. `useRecoilValue()` value만 필요한 컴포넌트
2. `useSetRecoilState()` state를 변경하기만 하는 컴포넌트

```jsx
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { cookieState } from '../../state';

const cookies = useRecoilValue(cookieState);
const setCookies = useSetRecoilState(cookieState);
```

1. `useResetRecoilState()` 인자로 받아온 atom의 state를 default 값으로 **reset** 시키는 역할

```jsx
const resetCookies = useResetRecoilState(cookieState);
```

---

### selector함수

```tsx
function selector<T>({
  key: string,

  get: ({
    get: GetRecoilValue
  }) => T | Promise<T> | RecoilValue<T>,

  set?: (
    {
      get: GetRecoilValue,
      set: SetRecoilState,
      reset: ResetRecoilState,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,
})
```

- selector는 **read-only** 한 `RecoilValueReadOnly`

객체로서 return 값 만을 가질 수 있고 값을 `set` 할 순 없는 특징

state.js

```tsx
export const cookieState = atom({
  key: 'cookieState',
  default: [],
});

export const getCookieSelector = selector({
  key: 'cookie/get',
  get: async ({ get }) => {
    try {
      const { data } = await client.get('/cookies');
      return data.data;
    } catch (err) {
      throw err;
    }
  },
  set: ({ set }, newValue) => {
    set(cookieState, newValue);
  },
});
```

- **key**: selector를 구분할 수 있는 유일한 `id`, 즉 key 값을 의미
- **get**: 에는 `derived state` 를 return 하는 곳. 예시 코드에서는 api call을 통해 받아온 data를 return
  `const cookie = useRecoilValue(selector)` 이렇게 조회 가능
- **set**: writeable 한 state 값을 변경할 수 있는 함수를 return 하는 곳
  selector는 **read-only** 한 return 값(`RecoilValue`)만 가지기 때문에 set으로는 **writeable**한 atom 의 `RecoilState` 만 설정 가능

```tsx
set: ({ set }, newValue) => {
  set(getCookieSelector, newValue);
}; // incorrect : cannot allign itself

set: ({ set }, newValue) => {
  set(cookieState, newValue);
}; // correct : can allign another upstream atom that is writeable RecoilState
```

```tsx
const [cookie, setCookie] = useRecoilState(cookieState);
```

---

### Suspense, 비동기 상태 처리

```tsx
import React, { Suspense } from 'react';
import { Cookies } from '../components';

const App = () => {
  return (
    <RootRecoil>
      <Suspense fallback={<div>Loading...</div>}>
        {' '}
        // shimmer 주입 가능
        <Cookies />
      </Suspense>
    </RootRecoil>
  );
};

export default App;
```

### Suspense대신 Recoil의 Loadable을 사용할 수도 있다

```tsx
import { getCookieSeletor } from '../../reocil';
import { useRecoilState, useRecoilValueLoadable } from 'recoil';

const Cookies = () => {
  const cookieLoadable = useRecoilValueLoadable(getCookieSelector);

  switch(cookieLoadable.state){
    case 'hasValue':
      return (
        <>
          (<div>
    	    {cookieLoadable.contents.map(cookie =>(
              <Card
                cookies={cookie}
                key={cookie.id}
                idx={cookie.id}
               />
            ))}
	     </div>)
	  </>
	});
     case 'loading':
  	return <Loading />;
     case 'hasError':
     	throw cookieLoadable.contents;
}

export default Cookies;
```

**Loadable 객체**

`const cookieLoadable = useRecoilValueLoadable(getcookieSelector);`

**state** : `hasValue`, `hasError`, `loading` atom 이나 selector의 상태를 말하며, 앞의 세 가지 상태

**contents**: atom이나 contents의 값을 나타내며, 상태에 따라 다른 값 보유.

- `hasValue`상태일 땐 `value`
- `hasError`일 땐 `Error`객체
- `loading` 일 땐 `Promise`

### selector는 기본적으로 값을 캐싱

기존의 atom을 이용한 방식은 매번 api call을 하고 있는 반면, selector로 바꿔서 구현했을 땐, 한번 call을 했던 api에 대한 캐싱이 이루어져 다시 호출하지 않음

> _캐시(cache)는 컴퓨터 과학에서 데이터나 값을 미리 복사해 놓는 임시 장소를 가리킨다. 캐시는 캐시의 접근 시간에 비해 원래 데이터를 접근하는 시간이 오래 걸리는 경우나 값을 다시 계산하는 시간을 절약하고 싶은 경우에 사용한다. 캐시에 데이터를 미리 복사해 놓으면 계산이나 접근 시간 없이 더 빠른 속도로 데이터에 접근할 수 있다_

---

### 외부에서 파라미터로 값을 받아와서 selector에 적용해야 할 경우에 `selectorFamily`

```tsx
`https://baseUrl.com/type=${apiTypes}`;
```

```tsx
// state.jsx

export const githubRepo = selectorFamily({
  key: 'github/get',
  get: (githubId) => async () => {
    if (!githubId) return '';

    const { data } = await axios.get(
      `https://api.github.com/repos/${githubId}`
    );
    return data;
  },
});
```

```tsx
// Github.jsx

import { useRecoilValue } from 'recoil';
import { selectorFamily } from '../../state';

const Github = () => {
  const githubId = 'juno7803';
  const githubRepos = useRecoilValue(githubRepo(githubId));

  return (
    <>
      <div>Repos : {githubRepos}</div>
    </>
  );
};
export default Github;
```
