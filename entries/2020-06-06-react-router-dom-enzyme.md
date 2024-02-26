---
title: "ReactRouterDOM に依存した Component を enzyme でテストする"
date: 2020-06-06
---

ReactRouterDOM の <Route /> に依存する、例えば <Link /> 等を内部に持つ Component の場合、テストする際に ReactRouter の <MemoryRouter /> を使用することで、擬似的に <Route /> 以下に存在するものとして動作させることができます。

```javascript
const wrapper = mount(
  <MemoryRouter>
    <Component {...props} />
  </MemoryRouter>
);

expect(wrapper.find(".nav")).toHaveLength(1);
```

MemoryRouter には initialEntries 等の props により Router の状態を渡すことができます。

https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/MemoryRouter.md

また、 `wrapper.setProps()` で props を更新する方法がありますが、 MemoryRouter を用いた方法だと本来 props を操作したい Component ではなく、 MemoryRouter の props が操作されてしまいます。
これは、 `wrapper.props()` から children を取得し、 cloneElement で props を更新します。

```javascript
wrapper.setProps({
  children: React.cloneElement(wrapper.props().children, { login: true }),
});
```

[enzymejs/enzyme#1384](https://github.com/enzymejs/enzyme/issues/1384)
