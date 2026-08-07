---
name: stylex
description: StyleX — Meta 的编译时 CSS-in-JS（原子 CSS、零运行时、主题系统、框架无关）
---

# StyleX

Meta 出品的 CSS-in-JS：用 `stylex.create` 定义、`stylex.props` 应用，babel 插件在编译时把每条声明编译成原子 class，聚合成静态 CSS 文件。生产零运行时，框架无关（React/Solid/Preact/Qwik）。`@stylexjs/stylex@0.19+`。

核心理念：**样式是一等对象**——可作 prop 传递、条件组合，组件带默认样式又可被覆盖。与 UnoCSS（工具类语法）互补，见 [../ui/SKILL.md](../ui/SKILL.md)；与 antd v6 组件库的关系见 [../ui/references/antd-v6.md](../ui/references/antd-v6.md)。

## References

| Topic | Reference |
|-------|-----------|
| 安装与编译器配置 | [installation](references/installation.md) |
| 定义与应用样式 | [styling](references/styling.md) |
| 主题系统 | [theming](references/theming.md) |
| 实战模式 | [recipes](references/recipes.md) |
| 其他 API 与类型 | [api-reference](references/api-reference.md) |
