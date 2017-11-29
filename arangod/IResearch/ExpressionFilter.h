////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2017 ArangoDB GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Andrey Abramov
/// @author Vasiliy Nabatchikov
////////////////////////////////////////////////////////////////////////////////

#ifndef ARANGODB_IRESEARCH__IRESEARCH_EXPRESSION_FILTER
#define ARANGODB_IRESEARCH__IRESEARCH_EXPRESSION_FILTER 1

#include "Aql/Expression.h"

#include "search/filter.hpp"

NS_BEGIN(arangodb)

NS_BEGIN(aql)
struct AstNode;
class Ast;
class ExecutionPlan;
NS_END // aql

NS_BEGIN(iresearch)

///////////////////////////////////////////////////////////////////////////////
/// @struct ExpressionCompilationContext
///////////////////////////////////////////////////////////////////////////////
struct ExpressionCompilationContext {
  bool operator==(ExpressionCompilationContext const& rhs) const noexcept {
    return plan == rhs.plan
      && ast == rhs.ast
      && node == rhs.node;
  }

  bool operator!=(ExpressionCompilationContext const& rhs) const noexcept {
    return !(*this == rhs);
  }

  explicit operator bool() const noexcept {
    return plan && ast && node;
  }

  size_t hash() const noexcept;

  arangodb::aql::ExecutionPlan* plan{};
  arangodb::aql::Ast* ast{};
  std::shared_ptr<arangodb::aql::AstNode> node{};
}; // ExpressionCompilationContext

///////////////////////////////////////////////////////////////////////////////
/// @struct ExpressionExecutionContext
///////////////////////////////////////////////////////////////////////////////
struct ExpressionExecutionContext : irs::attribute {
  DECLARE_ATTRIBUTE_TYPE();

  ExpressionExecutionContext() = default;

  ExpressionExecutionContext(
      arangodb::transaction::Methods& trx)
    : trx(&trx) {
  }

  explicit operator bool() const noexcept {
    return trx && ctx;
  }

  arangodb::transaction::Methods* trx{};
  arangodb::aql::ExpressionContext* ctx{};
}; // ExpressionFilterContext

///////////////////////////////////////////////////////////////////////////////
/// @class ByExpression
/// @brief user-side filter based on arbitrary ArangoDB `Expression`
///////////////////////////////////////////////////////////////////////////////
class ByExpression final : public irs::filter {
 public:
  DECLARE_FACTORY_DEFAULT();
  DECLARE_FILTER_TYPE();

  ByExpression() noexcept;

  void init(
      aql::ExecutionPlan& plan,
      aql::Ast& ast,
      arangodb::aql::AstNode& node
  ) noexcept {
    _ctx.plan = &plan;
    _ctx.ast = &ast;
    _ctx.node.reset(&node, [](arangodb::aql::AstNode*){});
  }

  void init(
      aql::ExecutionPlan& plan,
      aql::Ast& ast,
      std::shared_ptr<arangodb::aql::AstNode>&& node
  ) noexcept {
    _ctx.plan = &plan;
    _ctx.ast = &ast;
    _ctx.node = std::move(node);
  }

  using irs::filter::prepare;

  virtual irs::filter::prepared::ptr prepare(
    irs::index_reader const& index,
    irs::order::prepared const& ord,
    irs::boost::boost_t boost,
    irs::attribute_view const& ctx
  ) const override;

  virtual size_t hash() const override;

  ExpressionCompilationContext const& context() const noexcept {
    return _ctx;
  }

  explicit operator bool() const noexcept {
    return bool(_ctx);
  }

 protected:
  virtual bool equals(irs::filter const& rhs) const override;

 private:
  ExpressionCompilationContext _ctx;
}; // ByExpression

NS_END // iresearch
NS_END // arangodb

#endif // ARANGODB_IRESEARCH__IRESEARCH_EXPRESSION_FILTER
